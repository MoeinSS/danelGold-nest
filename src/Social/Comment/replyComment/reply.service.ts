import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Reply } from "./entity/reply.entity";
import { User, UserRole } from "@/User/user/entity/user.entity";
import { Repository } from "typeorm";
import { CreateReplyDTO } from "./dto/CreateReply.dto";
import { Comment } from "@/Social/Comment/comment/entity/comment.entity";
import { UpdateReplyDTO } from "./dto/UpdateReply.dto";
import { ApiResponses, createResponse } from "@/utils/response.util";


@Injectable()
export class ReplyService{
    constructor(
        @InjectRepository(Reply) 
        private replyRepository: Repository<Reply>,
        @InjectRepository(Comment) 
        private commentRepository: Repository<Comment>,
        @InjectRepository(User) 
        private userRepository: Repository<User>,
      ) {}
    
      async createReply(
        phone: string, 
        addReplyDto: CreateReplyDTO
      ): Promise<Reply> {
        const { content, parentCommentId, parentReplyId } = addReplyDto;
    
        console.log(`Fetching user with phone: ${phone}`);
        
        const user = await this.userRepository.findOne({
          where: { phone: phone },
          select: ['userName'],
        });
    
        if (!user) {
          console.error(`User not found with phone: ${phone}`);
          throw new NotFoundException('User not found');
        }
    
        console.log(`User found: ${user.userName}`);
    
        const existingComment = await this.commentRepository.findOne({ where: { id: parentCommentId } });
    
        if (!existingComment) {
          console.error(`Parent comment not found with id: ${parentCommentId}`);
          throw new NotFoundException('Parent comment not found');
        }
    
        const newReply = this.replyRepository.create({
          user: {
            userName: user.userName,
            phone: phone,
          },
          content,
          parentCommentId,
          parentReplyId,
        });
    
        const savedReply = await this.replyRepository.save(newReply);
        return savedReply;
      }
      
      async updateReply(
        replyId: number,
        currentUserPhone: string, 
        updateReplyDTO: UpdateReplyDTO
      ): Promise<ApiResponses<Reply>> {

        const { content } = updateReplyDTO;
    
        const reply = await this.replyRepository.findOneBy({id:replyId});
    
        if (!reply) {
          throw new NotFoundException('پاسخ پیدا نشد');
        }

        if (reply.userPhone !== currentUserPhone) {
          throw new UnauthorizedException('شما اجازه حذف این پاسخ را ندارید');
        }
    
        reply.content = content;
        reply.updatedAt = new Date();
    
        const savedReply = await this.replyRepository.save(reply);

        return createResponse(200,savedReply,'با موفقیت ویرایش گردید')
      }

      async deleteReply(replyId: number, currentUserPhone: string): Promise<string> {
        const reply = await this.replyRepository.findOneBy({id:replyId});
    
        if (!reply) {
          throw new NotFoundException('پاسخی پیدا نشد');
        }

        const currentUser = await this.userRepository.findOne({
          where: { phone: currentUserPhone },
        });

        if (reply.userPhone !== currentUserPhone) {
          throw new UnauthorizedException('شما اجازه حذف این پاسخ را ندارید');
        }
    
        await this.replyRepository.remove(reply);
        return'پاسخ حذف گردید'
      }

      async deleteAdminReply(
        replyIds: number[]
      ): Promise<{ message: string }> {
        const replies = await this.replyRepository.findByIds(replyIds);
      
        if (replies.length !== replyIds.length) {
          throw new NotFoundException('پاسخ یافت نشد');
        }
      
        await this.replyRepository.remove(replies);
      
        return { message: 'با موفقیت حذف گردید' };
      }
}