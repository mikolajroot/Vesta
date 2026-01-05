import { Body, Controller, Post, HttpCode, HttpStatus, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Public } from './decorators/public.decorator';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Sign in user' })
  @ApiBody({
    type: SignInDto,
    examples: {
      default: { value: { username: 'john_doe', password: 'password123' } }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User signed in successfully',
    example: { access_token: 'eyJhbGciOiJIUzI1NiIs...' }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Public()
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({
    type: SignUpDto,
    examples: {
      default: { value: { username: 'john_doe', password: 'password123' } }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    example: { id: 123, username: 'john_doe', message: 'User created' }
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto.username, signUpDto.password,signUpDto.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    example: { sub: 123, username: 'john_doe' }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
