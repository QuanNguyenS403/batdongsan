import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  root(@Req() req: Request, @Res() res: Response) {
    const accepts = req.headers.accept || '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Nếu người dùng truy cập bằng trình duyệt (Accept: text/html), chuyển hướng tức thì sang Frontend
    if (accepts.includes('text/html')) {
      return res.redirect(302, siteUrl);
    }

    // Nếu là API client hoặc fetch, trả về trạng thái JSON thân thiện
    return res.json({
      name: 'Batdongsan Backend API',
      status: 'online',
      version: '0.1.0',
      frontendUrl: siteUrl,
      swaggerDocs: '/docs',
      healthCheck: '/health',
      message: 'Hệ thống API đang chạy bình thường. Truy cập website tại ' + siteUrl,
    });
  }
}
