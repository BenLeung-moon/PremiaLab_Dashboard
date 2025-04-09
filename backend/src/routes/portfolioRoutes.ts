import { Router } from 'express';
import { 
  getAllPortfolios, 
  getPortfolioById, 
  createPortfolio 
} from '../controllers/portfolioController';

const router = Router();

// 获取所有投资组合
router.get('/', getAllPortfolios);

// 获取单个投资组合
router.get('/:id', getPortfolioById);

// 创建新投资组合
router.post('/', createPortfolio);

export default router; 