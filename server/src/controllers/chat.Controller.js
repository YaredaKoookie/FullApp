const Chat = require('../models/OtherModels/chat.models');
const Message = require('../models/OtherModels/message.models');
const Appointment = require('../models/appointment/appointment.model');
const User = require('../models/user.model');
const { jwt: { AccessToken }, VideoGrant } = require('twilio');

exports.getMessages = async (req, res) => {
  try {
    // const userId = req.user.userId;
    const userId = req.user.sub;
    const { appointmentId } = req.params;

    // 1. Verify the appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // 2. Check that the requester is either the doctor or the patient for this appointment
    if (![appointment.doctor.toString(), appointment.patient.toString()].includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 3. Find or create the Chat document
    let chat = await Chat.findOne({ appointment: appointmentId });
    if (!chat) {
      // Create new chat with both participants
      chat = await Chat.create({
        appointment: appointmentId,
        participants: [appointment.doctor, appointment.patient]
      });
    }
    // 4. Fetch all messages for this chat
    const messages = await Message.find({ chat: chat._id })
      .populate('sender', 'fullName profilePicture')   // include sender name & avatar
      .sort({ createdAt: 1 });                          // oldest first

    return res.status(200).json({
      message: 'Messages fetched successfully',
      chatId: chat._id,
      messages
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({
      message: 'An error occurred while fetching messages',
      error: err.message
    });
  }
};

exports.sendMessage = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
      const { content, attachments } = req.body;  // attachments: optional array of URLs
  
      // 1. Verify the appointment exists
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      // 2. Check that the requester is either the doctor or the patient
      if (![appointment.doctor.toString(), appointment.patient.toString()].includes(userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // 3. Find or create the Chat document
      let chat = await Chat.findOne({ appointment: appointmentId });
      if (!chat) {
        chat = await Chat.create({
          appointment: appointmentId,
          participants: [appointment.doctor, appointment.patient]
        });
      }
  
      // 4. Create the message
      const message = await Message.create({
        chat: chat._id,
        sender: userId,
        content,
        attachments: Array.isArray(attachments) ? attachments : []
      });
  
      // 5. Optionally: update Chat.updatedAt so you can sort chats by most recent message
      chat.updatedAt = new Date();
      await chat.save();
  
      // 6. Populate sender info for response
      await message.populate('sender', 'fullName profilePicture');
  
      return res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } catch (err) {
      console.error('Error sending message:', err);
      return res.status(500).json({
        message: 'An error occurred while sending the message',
        error: err.message
      });
    }
  };
  exports.getVideoCallToken = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
  
      // 1. Verify appointment exists and user is participant
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (![appointment.doctor.toString(), appointment.patient.toString()].includes(userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // 2. (Optional) Ensure a Chat exists for this appointment
      let chat = await Chat.findOne({ appointment: appointmentId });
      if (!chat) {
        chat = await Chat.create({
          appointment: appointmentId,
          participants: [appointment.doctor, appointment.patient]
        });
      }
  
      // 3. Create Twilio Access Token
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const apiKeySid  = process.env.TWILIO_API_KEY_SID;
      const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
      const identity = req.user.fullName || userId; // unique identity in your system
  
      const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
        identity
      });
  
      // 4. Grant access to Video
      const videoGrant = new VideoGrant({
        room: `appointment_${appointmentId}`
      });
      token.addGrant(videoGrant);
  
      // 5. Return the JWT
      return res.status(200).json({
        message: 'Video call token generated successfully',
        token: token.toJwt()
      });
    } catch (err) {
      console.error('Error generating video token:', err);
      return res.status(500).json({
        message: 'An error occurred while generating video token',
        error: err.message
      });
    }
  };





  // routes/chat.js (or in your main router file)
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const chatController = require('../controllers/chatController');
const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chat/');               // ensure this dir exists (or S3, etc.)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  }
});

// File filter (images, pdfs, etc.)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Unsupported file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Route
router.post(
  '/chat/:appointmentId/upload',
  auth,
  upload.single('file'),            // form field name is “file”
  chatController.uploadFile
);

module.exports = router;


// controllers/chatController.js

const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const path = require('path');

exports.uploadFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointmentId } = req.params;

    // 1. Verify the appointment and permissions
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (![appointment.doctor.toString(), appointment.patient.toString()].includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 2. Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 3. Find or create chat
    let chat = await Chat.findOne({ appointment: appointmentId });
    if (!chat) {
      chat = await Chat.create({
        appointment: appointmentId,
        participants: [appointment.doctor, appointment.patient]
      });
    }

    // 4. Create a message record with attachment URL
    //    Adjust the base URL as needed (e.g., CDN, S3, etc.)
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`;

    const message = await Message.create({
      chat: chat._id,
      sender: userId,
      content: '',        // no text content
      attachments: [fileUrl]
    });

    // 5. Respond with the new message
    await message.populate('sender', 'fullName profilePicture');

    return res.status(201).json({
      message: 'File uploaded and message created',
      data: message
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    return res.status(500).json({
      message: 'An error occurred while uploading the file',
      error: err.message
    });
  }
};

// controllers/chatController.js

const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');

exports.getChatStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointmentId } = req.params;

    // 1. Verify the appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // 2. Ensure the requester is part of this appointment
    if (![appointment.doctor.toString(), appointment.patient.toString()].includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 3. Find the chat for this appointment
    const chat = await Chat.findOne({ appointment: appointmentId });
    if (!chat) {
      return res.status(200).json({
        message: 'No chat exists yet',
        status: {
          unreadCount: 0,
          lastMessageAt: null
        }
      });
    }

    // 4. Count unread messages (sent by the *other* participant and not yet seen)
    const unreadCount = await Message.countDocuments({
      chat: chat._id,
      seen: false,
      sender: { $ne: userId }
    });

    // 5. Find the timestamp of the last message
    const lastMsg = await Message.findOne({ chat: chat._id })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();

    return res.status(200).json({
      message: 'Chat status fetched successfully',
      status: {
        unreadCount,
        lastMessageAt: lastMsg ? lastMsg.createdAt : null
      }
    });
  } catch (err) {
    console.error('Error fetching chat status:', err);
    return res.status(500).json({
      message: 'An error occurred while fetching chat status',
      error: err.message
    });
  }
};
