import { Request, Response, NextFunction } from 'express';
import { EmailTemplateService } from '../services/emailTemplate.service';
import { EmailTemplateType } from '../models/EmailTemplate';
import { AppError } from '../middlewares/errorHandler';

export const getTemplates = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templates = await EmailTemplateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    
    if (!Object.values(EmailTemplateType).includes(type as EmailTemplateType)) {
      throw new AppError('Invalid template type', 400);
    }

    const template = await EmailTemplateService.getTemplate(type as EmailTemplateType);
    
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const { name, subject, htmlContent, isActive } = req.body;
    
    if (!Object.values(EmailTemplateType).includes(type as EmailTemplateType)) {
      throw new AppError('Invalid template type', 400);
    }

    const template = await EmailTemplateService.updateTemplate(
      type as EmailTemplateType,
      { name, subject, htmlContent, isActive }
    );

    res.json({
      message: 'Template updated successfully',
      template,
    });
  } catch (error) {
    next(error);
  }
};

export const previewTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const { variables } = req.body;
    
    if (!Object.values(EmailTemplateType).includes(type as EmailTemplateType)) {
      throw new AppError('Invalid template type', 400);
    }

    const template = await EmailTemplateService.getTemplate(type as EmailTemplateType);
    
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const rendered = EmailTemplateService.renderTemplate(template, variables || {});

    res.json({
      subject: rendered.subject,
      html: rendered.html,
    });
  } catch (error) {
    next(error);
  }
};