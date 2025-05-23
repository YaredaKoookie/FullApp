import { Router } from "express";
import { patientChains, validate } from "../../validations";
import { patientController, reviewController } from "../../controllers";
import { validateCreateReview } from "../../validations/chains/review.chain";
import { doctorChains } from "../../validations/chains";
import { isProfileCompleted } from "../../middlewares/auth.middleware";

const router = Router();

router.get(
    "/",
    validate(doctorChains.validateGetDoctor),
    patientController.getApprovedDoctors
);


router.get(
    "/statistics",
    validate(patientChains.validateGetDoctorStatistics),
    patientController.getDoctorStatistics
)

router.get("/:doctorId", patientController.getApprovedDoctorById);


router.get("/:doctorId/can-review", reviewController.canReviewDoctor);

router.get("/:doctorId/reviews", reviewController.getReviews);

router.post(
    "/:doctorId/review",
    validate(validateCreateReview),
    reviewController.createReview
);

export default router;