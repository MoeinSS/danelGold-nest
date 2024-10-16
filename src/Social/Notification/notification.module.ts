import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entity/notification.entity";


@Module({
    imports: [TypeOrmModule.forFeature([Notification])]
})
export class NotificationModule{}