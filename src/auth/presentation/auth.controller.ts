import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LoginUseCase } from '../application/login.usecase';
import { SignUpUseCase } from '../application/signup.usecase';
import {
  loginDtoSchema,
  signUpDtoSchema,
  type LoginDto,
  type SignUpDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(signUpDtoSchema))
  signUp(@Body() dto: SignUpDto) {
    return this.signUpUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginDtoSchema))
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }
}
