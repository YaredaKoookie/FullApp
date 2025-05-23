import { Router } from "express";
import { reviewController } from "../../controllers";
import { validateUpdateReview } from "../../validations/chains/review.chain";
import { validate } from "../../validations";

const router = Router();

router.put("/:reviewId", validate(validateUpdateReview), reviewController.updateReview);
router.delete("/:reviewId", reviewController.deleteReview);

export default router;
