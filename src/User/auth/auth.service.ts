import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  UnauthorizedException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserService } from '@/User/user/user.service';
import { UserDetailService } from '@/User/user-detail/userDetail.service';
import { OtpService } from './otp/otp.service';
import { TokenService } from './token/token.service';
import { User } from '@/User/user/entity/user.entity';
import { UserDetail } from '@/User/user-detail/entity/userDetail.entity';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
  ) {}

  async login(
    email_or_phone: string,
    password: string
  ): Promise<any> {

    const isPhone = /^[0-9]+$/.test(email_or_phone);
    const isEmail = /\S+@\S+\.\S+/.test(email_or_phone);
  
    let user;
    if (isPhone) {
      user = await this.userRepository.findOne({ where: { phone: email_or_phone } });
    } else if (isEmail) {
      user = await this.userRepository.findOne({ where: { email: email_or_phone } });
    } else {
      throw new BadRequestException('Invalid email or phone number');
    }
  
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const token = await this.tokenService.createToken(user);
  
    return {
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.userName,
      },
    };
  }

  async checkUserNameAvailability(userName: string): Promise<any> {
    const existingUserName = await this.userRepository.findOne({ where: { userName } });
    if (existingUserName) {
      throw new BadRequestException('Username already exists');
    }

    return {
      status: 'success',
      message: 'Username accepted',
    };
  }

  async checkUserExists(phone: string, email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: [{ phone }, { email }],
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
  }

  async sendOTPToPhoneOrEmail(email_or_phone: string): Promise<any> {
    const isPhone = /^[0-9]+$/.test(email_or_phone);
    const isEmail = /\S+@\S+\.\S+/.test(email_or_phone);
  
    if (isPhone) {
      await this.checkUserExists(email_or_phone, '');
    } else if (isEmail) {
      await this.checkUserExists('', email_or_phone); 
    } else {
      throw new BadRequestException('Invalid phone number or email');
    }
  
    if (isPhone) {
      await this.otpService.sendOTP(email_or_phone); 
    } else if (isEmail) {
      await this.otpService.sendOTPToEmail(email_or_phone);
    }
  
    return {
      status: 'success',
      message: 'Verification code sent',
    };
  }

  async verifyCode(
    email_or_phone: string,
    verification_code: string
  ): Promise<any> {
    const isPhone = /^[0-9]+$/.test(email_or_phone);
    const isEmail = /\S+@\S+\.\S+/.test(email_or_phone);
  
    const codeAsString = verification_code.toString();
    let user;
  
    if (isPhone) {
      const isValidOTP = await this.otpService.verifyOTP(email_or_phone, codeAsString);
      if (!isValidOTP) {
        throw new BadRequestException('Invalid verification code');
      }
      user = await this.userRepository.findOneBy({ phone: email_or_phone });
    } else if (isEmail) {
      const isValidOTP = await this.otpService.verifyOTP(email_or_phone, codeAsString);
      if (!isValidOTP) {
        throw new BadRequestException('Invalid verification code');
      }
      user = await this.userRepository.findOneBy({ email: email_or_phone });
    } else {
      throw new BadRequestException('Invalid phone number or email');
    }
  
    if (!user) {
      user = this.userRepository.create({
        phone: isPhone ? email_or_phone : null,
        email: isEmail ? email_or_phone : null,
        userName: '', // Placeholder, prompt user to set this later
        password: '', // Placeholder, user will set their password later
        isVerified: true,
      });
      await this.userRepository.save(user);
    } else {
      user.isVerified = true;
      await this.userRepository.save(user);
    }
  
    return {
      status: 'success',
      message: 'Verification code verified, user created/updated successfully',
    };
  }
  
  async setPassword(
    email_or_phone: string,
    password: string,
    confirmPassword: string
  ): Promise<any> {
  
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
  
    const isPhone = /^[0-9]+$/.test(email_or_phone);
    const isEmail = /\S+@\S+\.\S+/.test(email_or_phone);
  
    let user;
    if (isPhone) {
      user = await this.userRepository.findOneBy({ phone: email_or_phone });
    } else if (isEmail) {
      user = await this.userRepository.findOneBy({ email: email_or_phone });
    } else {
      throw new BadRequestException('Invalid phone number or email');
    }
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  
    await this.userRepository.save(user);
  
    return {
      status: 'success',
      message: 'Password set successfully',
    };
  }
  

  async forgotPassword(email_or_phone_or_username: string): Promise<any> {
    const isPhone = /^[0-9]+$/.test(email_or_phone_or_username);
    const isEmail = /\S+@\S+\.\S+/.test(email_or_phone_or_username);
    const isUsername = /^[a-zA-Z0-9_]+$/.test(email_or_phone_or_username);
  
    let user;
  
    if (isPhone) {
      user = await this.userRepository.findOne({ where: { phone: email_or_phone_or_username } });
    } else if (isEmail) {
      user = await this.userRepository.findOne({ where: { email: email_or_phone_or_username } });
    } else if (isUsername) {
      user = await this.userRepository.findOne({ where: { userName: email_or_phone_or_username } });
    } else {
      throw new BadRequestException('Invalid email, phone number, or username');
    }
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Send OTP to user email or phone
    await this.otpService.sendOTPToEmail(user.phone || user.email);
  
    return { status: 'success', message: 'Verification code sent' };
  }

  async verifyForgotPasswordCode(
    email_or_phone_or_username: string, 
    verification_code: string
  ): Promise<any> {
    const isPhone = /^[0-9]+$/.test(email_or_phone_or_username);
    const isEmail = /\S+@\S+\.\S+/.test(email_or_phone_or_username);
    const isUsername = /^[a-zA-Z0-9_]+$/.test(email_or_phone_or_username);
  
    let user;
  
    if (isPhone) {
      user = await this.userRepository.findOne({ where: { phone: email_or_phone_or_username } });
    } else if (isEmail) {
      user = await this.userRepository.findOne({ where: { email: email_or_phone_or_username } });
    } else if (isUsername) {
      user = await this.userRepository.findOne({ where: { userName: email_or_phone_or_username } });
    } else {
      throw new BadRequestException('Invalid email, phone number, or username');
    }
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const isValidOTP = await this.otpService.verifyOTP(email_or_phone_or_username, verification_code);
    
    if (!isValidOTP) {
      throw new BadRequestException('Invalid verification code');
    }
  
    return { status: 'success', message: 'Code verified' };
  }

  async resetPassword(
    password: string, 
    confirm_password: string, 
    userId: number): Promise<void> {
    if (password !== confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }
  
    const user = await this.userRepository.findOneBy({ id: userId });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  
    await this.userRepository.save(user);
  }
  
  
  
  
}
