import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@/Social/Post/posts/entity/posts.entity';
import { likePost } from '@/Social/Post/like-post/entity/like-post.entity';

@Injectable()
export class LikePostService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(likePost)
        private readonly likePostRepository: Repository<likePost>
    ){}

    async likePost(
        postId: number, 
        userPhone: string, 
      ): Promise<{ isLike: number }> {
        
        const likablePost = await this.postRepository.findOneBy(
          {id: postId}
        );
    
        if (!likablePost) {
            throw new NotFoundException('پستی پیدا نشد!');
        }
    
        let existingLike = await this.likePostRepository.findOne({
            where: { post: { id: postId }, userPhone },
        });
    
        if (!existingLike) {
            existingLike = this.likePostRepository.create({
                post: likablePost,
                userPhone,
                isLike: 1,
            });
            likablePost.likes++;
        } else {
            if (existingLike.isLike === 1) {
                existingLike.isLike = 0;
                likablePost.likes--;
            } else if (existingLike.isLike === -1) {
                existingLike.isLike = 1;
                likablePost.likes++;
                likablePost.dislikes--;
            } else {
                existingLike.isLike = 1;
                likablePost.likes++;
            }
        }
    
        await this.likePostRepository.save(existingLike);
        await this.postRepository.save(likablePost);
    
        return { isLike: existingLike.isLike };
    }
    
    async dislikePost(
      postId: number, 
      userPhone: string, 
    ): Promise<{ isDislike: number }> {
        
        const dislikablePost = await this.postRepository.findOneBy(
          {id: postId}
        );
    
        if (!dislikablePost) {
            throw new NotFoundException('کامنتی پیدا نشد!');
        }
    
        let existingDislike = await this.likePostRepository.findOne({
            where: { post: { id: postId }, userPhone },
        });
    
        if (!existingDislike) {
            existingDislike = this.likePostRepository.create({
                post: dislikablePost,
                userPhone,
                isLike: -1,
            });
            dislikablePost.dislikes++;
        } else {
            if (existingDislike.isLike === -1) {
                existingDislike.isLike = 0;
                dislikablePost.dislikes--;
            } else if (existingDislike.isLike === 1) {
                existingDislike.isLike = -1;
                dislikablePost.dislikes++;
                dislikablePost.likes--;
            } else {
                existingDislike.isLike = -1;
                dislikablePost.dislikes++;
            }
        }
    
        await this.likePostRepository.save(existingDislike);
        await this.postRepository.save(dislikablePost);
    
        return { isDislike: existingDislike.isLike };
    }
}
