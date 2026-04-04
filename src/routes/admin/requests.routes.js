import express from "express";
import {
  getRegistrationRequestsController,
  getRegistrationRequestController,
  createRegistrationRequestController,
  approveRegistrationRequestController,
  declineRegistrationRequestController,
  getVerificationRequestsController,
  getVerificationRequestController,
  createVerificationRequestController,
  approveVerificationRequestController,
  declineVerificationRequestController,
} from "../../controllers/admin/requests.controller.js";

const router = express.Router();

// ── Registration requests (admin-facing, public submit)
router.get(  "/registration",              getRegistrationRequestsController);   // admin
router.get(  "/registration/:id",          getRegistrationRequestController);    // admin
router.post( "/registration",              createRegistrationRequestController); // public
router.patch("/registration/:id/approve",  approveRegistrationRequestController); // admin
router.patch("/registration/:id/decline",  declineRegistrationRequestController); // admin

// ── Verification requests
router.get(  "/verification",              getVerificationRequestsController);   // admin
router.get(  "/verification/:id",          getVerificationRequestController);    // admin
router.post( "/verification/:userId",      createVerificationRequestController); // charity
router.patch("/verification/:id/approve",  approveVerificationRequestController); // admin
router.patch("/verification/:id/decline",  declineVerificationRequestController); // admin

export default router;