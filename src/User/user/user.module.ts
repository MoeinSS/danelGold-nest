import { Module } from "@nestjs/common";
import { User } from "./entity/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { Token } from "@/User/auth/token/entity/token.entity";
import { SmsService } from "@/services/sms.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "@/Social/Post/posts/entity/posts.entity";
import { Story } from "@/Social/Story/stories/entity/stories.entity";
import { Club } from "@/Social/Club/entity/club.entity";
import { FollowUser } from "@/Social/Follow/entity/follow.entity";



@Module({
    imports:[TypeOrmModule.forFeature([
        User,
        Token,
        Post,
        Story,
        Club,
        FollowUser
    ])],
    controllers:[UserController],
    providers:[UserService,SmsService]
})
export class UserModule{}