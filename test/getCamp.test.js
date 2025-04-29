// __tests__/campController.test.js
const mongoose = require('mongoose');
const { getCamps, getCamp, createCamp, updateCamp, deleteCamp } = require('../controllers/camps');
const Camp = require('../models/Camp');
const Booking = require('../models/Booking');
const { getObjectSignedUrl, uploadFile, deleteFile, generateFileName } = require('../controllers/s3');

jest.mock('../models/Camp');
jest.mock('../models/Booking');
jest.mock('../controllers/s3');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides) => ({
  user: { id: 'mockUserId', role: 'owner' },
  params: { id: 'mockCampId' },
  body: {},
  file: undefined,
  ...overrides
});

describe('Camp Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCamp', () => {
    it('should return camp data with signed URL', async () => {
      Camp.findById.mockResolvedValue({
        _id: 'camp123',
        picture: 'camp.jpg',
      });
      getObjectSignedUrl.mockResolvedValue('https://signed-url.com/camp.jpg');

      const req = mockReq({ params: { id: 'camp123' } });
      const res = mockRes();

      await getCamp(req, res);

      expect(getObjectSignedUrl).toHaveBeenCalledWith('camp.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ picture: 'https://signed-url.com/camp.jpg' }),
      });
    });

    it('should return 404 if camp not found', async () => {
      Camp.findById.mockResolvedValue(null);
      const req = mockReq();
      const res = mockRes();

      await getCamp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createCamp', () => {
    it('should create a new camp with uploaded image', async () => {
      const mockCamp = { name: 'New Camp' };
      generateFileName.mockReturnValue('new-image.jpg');
      uploadFile.mockResolvedValue();
      Camp.create.mockResolvedValue(mockCamp);

      const req = mockReq({
        file: { originalname: 'image.png', mimetype: 'image/png' },
        body: { name: 'New Camp' }
      });
      const res = mockRes();

      await createCamp(req, res);

      expect(uploadFile).toHaveBeenCalled();
      expect(Camp.create).toHaveBeenCalledWith(expect.objectContaining({
        picture: 'new-image.jpg',
        owner: 'mockUserId'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCamp
      });
    });
  });

  describe('deleteCamp', () => {
    it('should delete a camp and its bookings', async () => {
      const campData = {
        _id: 'campid',
        owner: 'mockUserId',
        picture: 'img.jpg',
        toString: () => 'mockUserId',
      };

      Camp.findById.mockResolvedValue(campData);
      Booking.deleteMany.mockResolvedValue();
      Camp.deleteOne.mockResolvedValue();
      deleteFile.mockResolvedValue();

      const req = mockReq({ params: { id: 'campid' } });
      const res = mockRes();

      await deleteCamp(req, res);

      expect(Booking.deleteMany).toHaveBeenCalledWith({ camp: 'campid' });
      expect(deleteFile).toHaveBeenCalledWith('img.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
    });

    it('should return 403 if user is not the owner or admin', async () => {
      Camp.findById.mockResolvedValue({
        _id: 'campid',
        owner: 'someoneElseId',
        picture: 'img.jpg',
      });

      const req = mockReq({ user: { id: 'notOwner', role: 'user' } });
      const res = mockRes();

      await deleteCamp(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});