import { Router } from 'express';
import { isAdmin } from '../middlewares/auth.middleware.js';
import { validateRequest, validateParams, validateQuery } from '../middlewares/validateRequest.js';
import { upload } from '../config/cloudinary.config.js';
import {
  addDoctorValidation,
  updateDoctorValidation,
  doctorIdValidation,
  toggleDoctorStatusValidation,
  listDoctorsValidation
} from '../validations/doctor.validation.js';
import {
  listDoctors,
  addNewDoctor,
  getDoctorForEdit,
  updateDoctor,
  toggleDoctorStatus,
  viewDoctorProfile,
  deleteDoctor,
  
  // User Management
  listUsers,
  getUserDetails,
  updateUser,
  toggleUserStatus,
  deleteUser
} from '../controllers/admin.controller.js';

const router = Router();

// Doctor Management Routes
router.get('/doctors', 
  isAdmin, 
  validateQuery(listDoctorsValidation),
  listDoctors
);

router.post('/doctors',
  isAdmin,
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'boardCertificationsDocument', maxCount: 1 },
    { name: 'educationDocument', maxCount: 1 }
  ]),
  addNewDoctor
);
  // validateRequest(addDoctorValidation),

router.get('/doctors/:id',
  isAdmin,
  validateParams(doctorIdValidation),
  getDoctorForEdit
);

router.put('/doctors/:id',
  isAdmin,
  validateParams(doctorIdValidation),
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'boardCertificationsDocument', maxCount: 1 },
    { name: 'educationDocument', maxCount: 1 }
  ]),
  validateRequest(updateDoctorValidation),
  updateDoctor
);

router.delete('/doctors/:id',
  isAdmin,
  validateParams(doctorIdValidation),
  deleteDoctor
);

router.patch('/doctors/:id/status',
  isAdmin,
  validateParams(doctorIdValidation),
  validateRequest(toggleDoctorStatusValidation),
  toggleDoctorStatus
);

router.get('/doctors/:id/profile',
  isAdmin,
  validateParams(doctorIdValidation),
  viewDoctorProfile
);

router.get('/users', listUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;