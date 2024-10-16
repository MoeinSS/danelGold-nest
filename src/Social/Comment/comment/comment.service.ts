import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/User/user/entity/user.entity';
import { Comment } from './entity/comment.entity';
import { UpdateCommentDTO } from './dto/UpdateComment.dto';
import { Reply } from '@/Social/Comment/replyComment/entity/reply.entity';
import { likeComment } from '@/Social/Comment/like-comment/entity/like-comment.entity';
import {
  PaginationResult,
} from '@/common/paginate/pagitnate.service';
import { CreateCommentDTO } from './dto/CreateComment';
import { ApiResponses, createResponse } from '@/utils/response.util';
import { Post } from '@/Social/Post/posts/entity/posts.entity';
import { Story } from '@/Social/Story/stories/entity/stories.entity';


const MAX_COMMENTS_PER_Post = 5;
const MAX_COMMENTS_PER_Story = 5;
const userCommentCounts: Map<string, number> = new Map();

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Reply)
    private readonly replyRepository: Repository<Reply>,
    @InjectRepository(likeComment)
    private readonly likeCommentRepository: Repository<likeComment>,
  ) {}

  async CommentPost(
    postId: number,
    userPhone: string,
    createCommentDTO: CreateCommentDTO,
  ): Promise<ApiResponses<Comment>> {

    const user = await this.userRepository.findOne({
      where: { phone: userPhone },
      select: ['userName',],
    });

    if (userCommentCounts.has(`${userPhone}-${postId}`)) {
      const commentCount =
        userCommentCounts.get(`${userPhone}-${postId}`) || 0;

      if (commentCount >= MAX_COMMENTS_PER_Post) {
        throw new BadRequestException('دیدگاه های شما به حد نصاب رسیده اند');
      }
    }

    const post = await this.postRepository.findOne({
      where: {id:postId}
    })

    if(!post){
      throw new NotFoundException('پست یافت نشد')
    }

    const newComment = {
      user: {
        userName: user.userName,
        phone: userPhone,
      },
      postId,
      content: createCommentDTO.content,
    };

    const createdComment = await this.commentRepository.save(newComment);

    return createResponse(201, createdComment, 'دیدگاه شما ثبت گردید ');
  }

  async CommentStory(
    storyId: number,
    userPhone: string,
    createCommentDTO: CreateCommentDTO,
  ): Promise<ApiResponses<Comment>> {

    const user = await this.userRepository.findOne({
      where: { phone: userPhone },
      select: ['userName'],
    });

    if (userCommentCounts.has(`${userPhone}-${storyId}`)) {
      const commentCount =
        userCommentCounts.get(`${userPhone}-${storyId}`) || 0;

      if (commentCount >= MAX_COMMENTS_PER_Story) {
        throw new BadRequestException('دیدگاه های شما به حد نصاب رسیده اند');
      }
    }

    const story = await this.storyRepository.findOne({
      where: { id: storyId}
    })

    if(!story){
      throw new NotFoundException('استوری یافت نشد')
    }

    const newComment = {
      user: {
        userName: user.userName,
        phone: userPhone,
      },
      storyId,
      content: createCommentDTO.content,
    };

    const createdComment = await this.commentRepository.save(newComment);

    return createResponse(201, createdComment, 'دیدگاه شما ثبت گردید ');
  }

  async updateComment(
    commentId: number,
    currentUserPhone: string,
    updateCommentDTO: UpdateCommentDTO,
  ): Promise<ApiResponses<Comment>> {
    const comment = await this.commentRepository.findOneBy({ id: commentId });

    if (!comment) {
      throw new NotFoundException('کامنتی پیدا نشد!');
    }

    if (comment.userPhone !== currentUserPhone) {
      throw new UnauthorizedException('شما مجاز به ویرایش دیدگاه نیستید');
    }

    comment.content = updateCommentDTO.content;
    comment.updatedAt = new Date();

    const updatedComment = await this.commentRepository.save(comment);

    return createResponse(200, updatedComment, 'با موفقیت ویرایش گردید');
  }

  async deleteComment(
    commentId: number,
    currentUserPhone: string,
  ): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['replies'],
    });

    if (!comment) {
      throw new NotFoundException('دیدگاه پیدا نشد');
    }

    if (comment.userPhone !== currentUserPhone) {
      throw new UnauthorizedException('شما مجاز به حذف دیدگاه نیستید');
    }

    if (comment.replies && comment.replies.length > 0) {
      await this.replyRepository.remove(comment.replies);
    }

    const likes = await this.likeCommentRepository.find({
      where: { commentId: commentId },
    });
    if (likes && likes.length > 0) {
      await this.likeCommentRepository.remove(likes);
    }

    await this.commentRepository.remove(comment);

    return { message: 'دیدگاه حذف گردید' };
  }

  async deleteAdminComments(
    commentIds: number[],
  ): Promise<{ message: string }> {
    for (const commentId of commentIds) {
      const comment = await this.commentRepository.findOne({
        where: { id: commentId },
        relations: ['replies'],
      });

      if (!comment) {
        throw new NotFoundException('دیدگاه پیدا نشد');
      }

      if (comment.replies && comment.replies.length > 0) {
        await this.replyRepository.remove(comment.replies);
      }

      const likes = await this.likeCommentRepository.find({
        where: { commentId: commentId },
      });
      if (likes && likes.length > 0) {
        await this.likeCommentRepository.remove(likes);
      }

      await this.commentRepository.remove(comment);
    }

    return { message: 'با موفقیت حذف گردید' };
  }

  async getCommentsByPost(
    postId: number,
    currentUserPhone: string,
    currentUserRoles: string[],
    query: any,
  ): Promise<ApiResponses<PaginationResult<any>>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const validSortOrder = ['ASC', 'DESC'];
    if (!validSortOrder.includes(sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }

    let total: number;
    if (sort === 'rating') {
      total = await this.commentRepository
        .createQueryBuilder('comment')
        .where('comment.postId = :postId', { postId })
        .getCount();
    } else {
      total = await this.commentRepository
        .createQueryBuilder('comment')
        .where('comment.postId = :postId', { postId })
        .getCount();
    }

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .leftJoinAndSelect('replies.parentComment', 'parentComment')
      .leftJoinAndSelect('parentComment.user', 'parentCommentUser')
      .leftJoinAndSelect('replies.parentReply', 'parentReply')
      .leftJoinAndSelect('parentReply.user', 'parentReplyUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.postId',
        'comment.likes',
        'comment.dislikes',
        'user.userName',
      ])
      .addSelect([
        'replies.id',
        'replies.content',
        'replies.createdAt',
        'replies.updatedAt',
        'replies.parentCommentId',
        'replies.parentReplyId',
        'replyUser.userName',
      ])
      .addSelect([
        'parentComment.id',
        'parentCommentUser.userName',
      ])
      .addSelect([
        'parentReply.id',
        'parentReplyUser.userName',
      ])
      .where('comment.postId = :postId', { postId })
      .orderBy(`comment.${sort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const rawComments = await queryBuilder.getMany();

    const processedComments = rawComments.map((comment) => {
      const isOwner = comment.userPhone === currentUserPhone;
      const isAdmin = currentUserRoles.includes('admin');
      const canUpdateComment = isOwner || isAdmin;

      const replies = comment.replies.map((reply) => {
        const isReplyOwner = reply.userPhone === currentUserPhone;

        return {
          ...reply,
          canUpdate: isReplyOwner || isAdmin,
        };
      });

      return {
        ...comment,
        canUpdate: canUpdateComment,
        replies,
      };
    });

    const totalPages = Math.ceil(total / limit);

    const paginationResult: PaginationResult<any> = {
      data: processedComments,
      total,
      totalPages,
      page,
      limit,
    };

    return createResponse(200, paginationResult);
  }

  async getCommentsByStory(
    storyId: number,
    currentUserPhone: string,
    currentUserRoles: string[],
    query: any,
  ): Promise<ApiResponses<PaginationResult<any>>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const validSortOrder = ['ASC', 'DESC'];
    if (!validSortOrder.includes(sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }

    let total: number;
    if (sort === 'rating') {
      total = await this.commentRepository
        .createQueryBuilder('comment')
        .where('comment.storyId = :storyId', { storyId })
        .getCount();
    } else {
      total = await this.commentRepository
        .createQueryBuilder('comment')
        .where('comment.storyId = :storyId', { storyId })
        .getCount();
    }

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .leftJoinAndSelect('replies.parentComment', 'parentComment')
      .leftJoinAndSelect('parentComment.user', 'parentCommentUser')
      .leftJoinAndSelect('replies.parentReply', 'parentReply')
      .leftJoinAndSelect('parentReply.user', 'parentReplyUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.storyId',
        'comment.likes',
        'comment.dislikes',
        'user.userName',
      ])
      .addSelect([
        'replies.id',
        'replies.content',
        'replies.createdAt',
        'replies.updatedAt',
        'replies.parentCommentId',
        'replies.parentReplyId',
        'replyUser.userName',
      ])
      .addSelect([
        'parentComment.id',
        'parentCommentUser.userName',
      ])
      .addSelect([
        'parentReply.id',
        'parentReplyUser.userName',
      ])
      .where('comment.storyId = :storyId', { storyId })
      .orderBy(`comment.${sort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const rawComments = await queryBuilder.getMany();

    const processedComments = rawComments.map((comment) => {
      const isOwner = comment.userPhone === currentUserPhone;
      const isAdmin = currentUserRoles.includes('admin');
      const canUpdateComment = isOwner || isAdmin;

      const replies = comment.replies.map((reply) => {
        const isReplyOwner = reply.userPhone === currentUserPhone;

        return {
          ...reply,
          canUpdate: isReplyOwner || isAdmin,
        };
      });

      return {
        ...comment,
        canUpdate: canUpdateComment,
        replies,
      };
    });

    const totalPages = Math.ceil(total / limit);

    const paginationResult: PaginationResult<any> = {
      data: processedComments,
      total,
      totalPages,
      page,
      limit,
    };

    return createResponse(200, paginationResult);
  }

  async getAllPostComments(
    query: any,
  ): Promise<ApiResponses<PaginationResult<any>>> {
    const {
      page = 1,
      limit = 10,
      search,
      sort = 'createdAt',
      sortOrder = 'DESC',
      postId,
    } = query;

    const validSortOrder = ['ASC', 'DESC'];
    if (!validSortOrder.includes(sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post')
      .select([
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.postId',
        'comment.likes',
        'comment.dislikes',
        'comment.userPhone',
        'user.userName',
      ])
      .orderBy(`comment.${sort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(user.userName ILIKE :search OR comment.userPhone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }

    const comments = await queryBuilder.getMany();

    if (comments.length === 0) {
      const emptyResult: PaginationResult<any> = {
        data: [],
        total: 0,
        totalPages: 0,
        page,
        limit,
      };
      return createResponse(200, emptyResult);
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    const paginationResult: PaginationResult<any> = {
      data: comments,
      total,
      totalPages,
      page,
      limit,
    };

    return createResponse(200, paginationResult);
  }

  async getAllStoryComments(
    query: any,
  ): Promise<ApiResponses<PaginationResult<any>>> {
    const {
      page = 1,
      limit = 10,
      search,
      sort = 'createdAt',
      sortOrder = 'DESC',
      storyId,
    } = query;

    const validSortOrder = ['ASC', 'DESC'];
    if (!validSortOrder.includes(sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.story', 'story')
      .select([
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.storyId',
        'comment.likes',
        'comment.dislikes',
        'comment.userPhone',
        'user.userName',
      ])
      .orderBy(`comment.${sort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(user.userName ILIKE :search OR comment.userPhone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (storyId) {
      queryBuilder.andWhere('comment.storyId = :storyId', { storyId });
    }

    const comments = await queryBuilder.getMany();

    if (comments.length === 0) {
      const emptyResult: PaginationResult<any> = {
        data: [],
        total: 0,
        totalPages: 0,
        page,
        limit,
      };
      return createResponse(200, emptyResult);
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    const paginationResult: PaginationResult<any> = {
      data: comments,
      total,
      totalPages,
      page,
      limit,
    };

    return createResponse(200, paginationResult);
  }

  async getPostCommentsByUser(
    currentUserPhone: string,
    phone: string,
    postId?: number,
  ): Promise<ApiResponses<any>> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('replies.parentComment', 'parentComment')
      .leftJoinAndSelect('parentComment.user', 'parentCommentUser')
      .leftJoinAndSelect('replies.parentReply', 'parentReply')
      .leftJoinAndSelect('parentReply.user', 'parentReplyUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.likes',
        'comment.dislikes',
        'post.id',
      ])
      .addSelect([
        'replies.id',
        'replies.content',
        'replies.createdAt',
        'replies.updatedAt',
        'replies.parentCommentId',
        'replies.parentReplyId',
        'replyUser.phone',
        'replyUser.userName',
      ])
      .addSelect([
        'parentReply.id',
        'parentReplyUser.userName',
      ])
      .where('comment.userPhone = :phone', { phone });
  
    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }

    const rawComments = await queryBuilder.getMany();

    const processedComments = rawComments.map((comment) => {
      const replies = comment.replies.map((reply) => {
        const isReplyOwner = reply.user?.phone === currentUserPhone;

        return {
          ...reply,
          canUpdate: isReplyOwner,
        };
      });

      return {
        ...comment,
        replies,
      };
    });

    return createResponse(200, processedComments);
  }

  async getStoryCommentsByUser(
    currentUserPhone: string,
    phone: string,
    storyId?: number,
  ): Promise<ApiResponses<any>> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .leftJoinAndSelect('comment.story', 'story')
      .leftJoinAndSelect('replies.parentComment', 'parentComment')
      .leftJoinAndSelect('parentComment.user', 'parentCommentUser')
      .leftJoinAndSelect('replies.parentReply', 'parentReply')
      .leftJoinAndSelect('parentReply.user', 'parentReplyUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.likes',
        'story.id',
        'comment.dislikes',
      ])
      .addSelect([
        'replies.id',
        'replies.content',
        'replies.createdAt',
        'replies.updatedAt',
        'replies.parentCommentId',
        'replies.parentReplyId',
        'replyUser.phone',
        'replyUser.userName',
      ])
      .addSelect([
        'parentReply.id',
        'parentReplyUser.userName',
      ])
      .where('comment.userPhone = :phone', { phone });
  
    if (storyId) {
      queryBuilder.andWhere('comment.storyId = :storyId', { storyId });
    }

    const rawComments = await queryBuilder.getMany();

    const processedComments = rawComments.map((comment) => {
      const replies = comment.replies.map((reply) => {
        const isReplyOwner = reply.user?.phone === currentUserPhone;

        return {
          ...reply,
          canUpdate: isReplyOwner,
        };
      });

      return {
        ...comment,
        replies,
      };
    });

    return createResponse(200, processedComments);
  }
}