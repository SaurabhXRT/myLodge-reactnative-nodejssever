// routes/room.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Room = require('../models/room');
const User = require('../models/user');

router.use(authMiddleware);

// Get all rooms
router.get('/filledRooms', async (req, res) => {
  try {
    const rooms = await Room.find({isFilled: true});
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get vacant rooms
router.get('/vacantrooms', async (req, res) => {
  try {
    const vacantRooms = await Room.find({   capacity: { $gt: 0 }});
    res.json(vacantRooms);
  } catch (error) {
    console.error('Error fetching vacant rooms:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/allot-room', async (req, res) => {
  try {
    const { roomId, selectedStudent, secondStudent, allotmentDate } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // if (room.isFilled) {
    //   return res.status(400).json({ error: 'Room is already filled' });
    // }

    if (room.capacity === 0) {
      return res.status(400).json({ error: 'Room is at full capacity' });
    }

    const studentsToAllot = [selectedStudent];
    if (room.capacity === 2 && secondStudent) {
      studentsToAllot.push(secondStudent);
      room.capacity = 0; 
      room.students = studentsToAllot;
      room.isFilled = true;
      await room.save();
    } else if(room.capacity === 1) {
      room.capacity = 0; 
      room.students.push(studentsToAllot);
      room.isFilled = true;
      await room.save();
    } else {
      room.students = studentsToAllot;
      room.isFilled = true;
      room.capacity = 1;
      await room.save();
     
    }

    room.isFilled = true;
  

    // Update students' room details
    for (const studentId of studentsToAllot) {
      const student = await User.findById(studentId);
      if (student) {
        student.room = roomId;
        student.dateJoined = allotmentDate;
        await student.save();
      }
    }

    res.json({ message: 'Room allotted successfully' });
  } catch (error) {
    console.error('Error allotting room:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ room: null }); 
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params; 
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/make-payment', async (req, res) => {
  try {
    const { roomId, message } = req.body;

    const room = await Room.findById(roomId).populate('students');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    room.payment.push(message);
    await room.save();

    for (const student of room.students) {
      student.payment.push(message);
      await student.save();
    }

    res.json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post("/add-dues",async (req,res) => {
    try {
    const { roomId, message } = req.body;

    const room = await Room.findById(roomId).populate('students');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    room.dues.push(message);
    await room.save();

    for (const student of room.students) {
      student.dues.push(message);
      await student.save();
    }

    res.json({ message: 'dues addedd successful' });
  } catch (error) {
    console.error('Error adding dues:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/fetch-dues/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomDues = room.dues;
    res.json(roomDues);
  } catch (error) {
    console.error('Error finding dues:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/fetch-payments/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const payments = room.payment;
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete-dues/:roomId/:dueId', async (req, res) => {
  try {
    const { roomId, dueId } = req.params;

    const room = await Room.findById(roomId).populate('students');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (dueId < 0 || dueId >= room.dues.length) {
      return res.status(400).json({ error: 'Invalid dueId' });
    }
    const dueMessage = room.dues[dueId];
    room.dues.splice(dueId, 1);
    await room.save();
    for (const student of room.students) {
      const dueIndex = student.dues.indexOf(dueMessage);
      if (dueIndex !== -1) {
        student.dues.splice(dueIndex, 1);
        await student.save();
      }
    }

    res.json({ message: 'Due deleted successfully' });
  } catch (error) {
    console.error('Error deleting due:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
