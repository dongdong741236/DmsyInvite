import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { InterviewQuestion, QuestionCategory } from '../models/InterviewQuestion';
import { AppError } from '../middlewares/errorHandler';

export const getQuestions = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const questionRepository = AppDataSource.getRepository(InterviewQuestion);
    const questions = await questionRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

export const getAllQuestions = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const questionRepository = AppDataSource.getRepository(InterviewQuestion);
    const questions = await questionRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, category, description, sortOrder } = req.body;
    const questionRepository = AppDataSource.getRepository(InterviewQuestion);

    const newQuestion = questionRepository.create({
      question,
      category,
      description,
      sortOrder: sortOrder || 0,
      isActive: true,
    });

    await questionRepository.save(newQuestion);

    res.status(201).json({
      message: 'Question created successfully',
      question: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { question, category, description, sortOrder, isActive } = req.body;
    const questionRepository = AppDataSource.getRepository(InterviewQuestion);

    const existingQuestion = await questionRepository.findOne({ where: { id } });
    if (!existingQuestion) {
      throw new AppError('Question not found', 404);
    }

    Object.assign(existingQuestion, {
      question,
      category,
      description,
      sortOrder,
      isActive,
    });

    await questionRepository.save(existingQuestion);

    res.json({
      message: 'Question updated successfully',
      question: existingQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const questionRepository = AppDataSource.getRepository(InterviewQuestion);

    const question = await questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    await questionRepository.remove(question);

    res.json({
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 初始化默认问题
export const initializeDefaultQuestions = async (): Promise<void> => {
  const questionRepository = AppDataSource.getRepository(InterviewQuestion);
  
  const defaultQuestions = [
    {
      question: '请简单介绍一下自己',
      category: QuestionCategory.GENERAL,
      description: '了解候选人的基本情况和表达能力',
      sortOrder: 1,
    },
    {
      question: '为什么想加入代码书院实验室？',
      category: QuestionCategory.MOTIVATION,
      description: '评估候选人的加入动机和目标',
      sortOrder: 2,
    },
    {
      question: '你有哪些编程经验？最熟悉什么语言？',
      category: QuestionCategory.TECHNICAL,
      description: '了解候选人的技术背景',
      sortOrder: 3,
    },
    {
      question: '描述一个你完成的项目，遇到了什么困难，如何解决的？',
      category: QuestionCategory.TECHNICAL,
      description: '评估解决问题的能力',
      sortOrder: 4,
    },
    {
      question: '如何看待团队合作？你在团队中通常扮演什么角色？',
      category: QuestionCategory.BEHAVIORAL,
      description: '评估团队协作能力',
      sortOrder: 5,
    },
    {
      question: '对未来的学习和职业发展有什么规划？',
      category: QuestionCategory.MOTIVATION,
      description: '了解候选人的长远规划',
      sortOrder: 6,
    },
  ];

  for (const questionData of defaultQuestions) {
    try {
      const existing = await questionRepository.findOne({
        where: { question: questionData.question },
      });
      
      if (!existing) {
        const question = questionRepository.create(questionData);
        await questionRepository.save(question);
        console.log(`✅ 面试问题初始化完成: ${questionData.question}`);
      }
    } catch (error) {
      console.error(`❌ 面试问题初始化失败: ${questionData.question}`, error);
    }
  }

  console.log('面试问题初始化完成');
};