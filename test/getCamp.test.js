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

  describe('getCamps', () => {
    let req, res, queryMock;
  
    beforeEach(() => {
      req = {
        query: {},
        user: { id: 'owner1', role: 'owner' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      // Chainable query mock
      queryMock = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };
  
      Camp.find.mockReturnValue(queryMock);
      Camp.countDocuments.mockResolvedValue(30);
      getObjectSignedUrl.mockResolvedValue('https://signed-url.com/pic.jpg');
    });
  
    test('should return filtered camps for owner with select and sort', async () => {
      req.query = {
        select: 'name,location',
        sort: 'name',
        page: '1',
        limit: '10'
      };
  
      queryMock.populate.mockReturnThis();
      queryMock.select.mockReturnThis();
      queryMock.sort.mockReturnThis();
      queryMock.skip.mockReturnThis();
      queryMock.limit.mockResolvedValue([
        { picture: 'camp1.jpg' },
        { picture: 'https://external.com/pic.jpg' }
      ]);
  
      await getCamps(req, res);
  
      expect(Camp.find).toHaveBeenCalledWith(expect.objectContaining({ owner: 'owner1' }));
      expect(queryMock.select).toHaveBeenCalled();
      expect(queryMock.sort).toHaveBeenCalledWith('name');
      expect(getObjectSignedUrl).toHaveBeenCalledWith('camp1.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 2
      }));
    });
  
    test('should apply default sort when no sort query', async () => {
      req.query = {};
      queryMock.populate.mockReturnThis();
      queryMock.sort.mockReturnThis();
      queryMock.skip.mockReturnThis();
      queryMock.limit.mockResolvedValue([]);
  
      await getCamps(req, res);
      expect(queryMock.sort).toHaveBeenCalledWith('-createdAt');
    });
  
    test('should include pagination.next when not last page', async () => {
      req.query = { page: '1', limit: '10' };
      queryMock.populate.mockReturnThis();
      queryMock.sort.mockReturnThis();
      queryMock.skip.mockReturnThis();
      queryMock.limit.mockResolvedValue([]);
  
      await getCamps(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('count');
      // check next page logic
    });
  
    test('should include pagination.prev when not first page', async () => {
      req.query = { page: '2', limit: '10' };
      queryMock.populate.mockReturnThis();
      queryMock.sort.mockReturnThis();
      queryMock.skip.mockReturnThis();
      queryMock.limit.mockResolvedValue([]);
  
      await getCamps(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result.success).toBe(true);
    });
  
    test('should handle no req.user', async () => {
      req.user = null;
      queryMock.populate.mockReturnThis();
      queryMock.sort.mockReturnThis();
      queryMock.skip.mockReturnThis();
      queryMock.limit.mockResolvedValue([]);
  
      await getCamps(req, res);
      expect(Camp.find).toHaveBeenCalledWith({});
    });
  
    test('should handle catch error', async () => {
      Camp.countDocuments.mockRejectedValue(new Error('DB Error'));
      await getCamps(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });

    
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

    it('should handle catch error', async () => {
      Camp.findById.mockRejectedValue(new Error('DB Error'));
      const req = mockReq({ params: { id: 'camp123' } });
      const res = mockRes();
    
      await getCamp(req, res);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false });
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

    it('should create a new camp without image upload', async () => {
      const mockCamp = { name: 'Camp without image' };
      Camp.create.mockResolvedValue(mockCamp);
    
      const req = mockReq({
        body: { name: 'Camp without image' },
      });
      const res = mockRes();
    
      await createCamp(req, res);
    
      expect(uploadFile).not.toHaveBeenCalled();
      expect(Camp.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Camp without image',
        owner: 'mockUserId'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCamp
      });
    });
    it('should return 400 if creation fails', async () => {
      Camp.create.mockRejectedValue(new Error('DB Error'));
    
      const req = mockReq({
        body: { name: 'Invalid camp' },
      });
      const res = mockRes();
    
      await createCamp(req, res);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create camp',
      });
    });
        
  });

  describe('updateCamp', () => {
    let req, res;
  
    beforeEach(() => {
      req = {
        params: { id: '123' },
        user: { id: 'user1', role: 'user' },
        body: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });
  
    test('should return 404 if camp not found', async () => {
      Camp.findById.mockResolvedValue(null);
  
      await updateCamp(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No campground with the id of 123`
      });
    });
  
    test('should return 403 if not owner and not admin', async () => {
      Camp.findById.mockResolvedValue({ owner: 'someoneElse' });
  
      await updateCamp(req, res);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `User user1 is not authorized to update this booking`
      });
    });
  
    test('should handle file upload and update camp', async () => {
      const oldCamp = { _id: '123', owner: 'user1', picture: 'old.jpg' };
      req.file = { buffer: Buffer.from('data'), mimetype: 'image/jpeg' };
      generateFileName.mockReturnValue('new.jpg');
      Camp.findById.mockResolvedValue(oldCamp);
      Camp.findByIdAndUpdate.mockResolvedValue({ ...oldCamp, ...req.body, picture: 'new.jpg' });
  
      await updateCamp(req, res);
  
      expect(deleteFile).toHaveBeenCalledWith('old.jpg');
      expect(uploadFile).toHaveBeenCalledWith(req.file, 'new.jpg', 'image/jpeg');
      expect(Camp.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ picture: 'new.jpg' })
      });
    });
  
    test('should update camp without file upload', async () => {
      const oldCamp = { _id: '123', owner: 'user1', picture: 'old.jpg' };
      Camp.findById.mockResolvedValue(oldCamp);
      Camp.findByIdAndUpdate.mockResolvedValue({ ...oldCamp, ...req.body });
  
      await updateCamp(req, res);
  
      expect(deleteFile).not.toHaveBeenCalled();
      expect(uploadFile).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    test('should return 400 on error', async () => {
      Camp.findById.mockImplementation(() => {
        throw new Error('DB error');
      });
  
      await updateCamp(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false });
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

    it('should handle catch error', async () => {
      Camp.findById.mockRejectedValue(new Error('DB Error'));
      const req = mockReq({ params: { id: 'camp123' } });
      const res = mockRes();
    
      await deleteCamp(req, res);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false , message: "DB Error"});
    });

    it('should return 404 if camp not found', async () => {
      Camp.findById.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'campid' } });
      const res = mockRes();
    
      await deleteCamp(req, res);
    
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No campground with the id of campid`
      });
    });

    it('should not delete image if picture is a full URL', async () => {
      const campData = {
        _id: 'campid',
        owner: 'mockUserId',
        picture: 'https://external.com/image.jpg',
        toString: () => 'mockUserId',
      };
    
      Camp.findById.mockResolvedValue(campData);
      Booking.deleteMany.mockResolvedValue();
      Camp.deleteOne.mockResolvedValue();
      deleteFile.mockResolvedValue();
    
      const req = mockReq({ params: { id: 'campid' } });
      const res = mockRes();
    
      await deleteCamp(req, res);
    
      expect(deleteFile).not.toHaveBeenCalled(); // สำคัญ!
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    test('should return 400 on error', async () => {
      Camp.findById.mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockReq({ params: { id: 'campid' } });
      const res = mockRes();
  
      await deleteCamp(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
    
  });
});
/*
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

  describe('updateCamp', () => {
    it('should update camp details and image if owner is authorized', async () => {
      const mockCamp = {
        _id: 'camp123',
        owner: 'mockUserId',
        picture: 'old.jpg',
        toString: () => 'mockUserId',
      };
  
      Camp.findById.mockResolvedValue(mockCamp);
      generateFileName.mockReturnValue('new-image.jpg');
      deleteFile.mockResolvedValue();
      uploadFile.mockResolvedValue();
      Camp.findByIdAndUpdate.mockResolvedValue({ ...mockCamp, picture: 'new-image.jpg' });
  
      const req = mockReq({
        params: { id: 'camp123' },
        file: { originalname: 'image.jpg', mimetype: 'image/jpeg' },
        body: { name: 'Updated Camp' },
      });
  
      const res = mockRes();
      await updateCamp(req, res);
  
      expect(deleteFile).toHaveBeenCalledWith('old.jpg');
      expect(uploadFile).toHaveBeenCalled();
      expect(Camp.findByIdAndUpdate).toHaveBeenCalledWith('camp123', expect.objectContaining({ picture: 'new-image.jpg' }), expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });
  
    it('should return 403 if user is not the owner', async () => {
      Camp.findById.mockResolvedValue({ owner: 'someoneElse' });
  
      const req = mockReq({ user: { id: 'wrongUser', role: 'user' } });
      const res = mockRes();
  
      await updateCamp(req, res);
  
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getCamps', () => {
    it('should return filtered and paginated list of camps', async () => {
      const mockCamps = [
        { _id: '1', picture: 'camp1.jpg' },
        { _id: '2', picture: 'camp2.jpg' }
      ];
  
      Camp.find.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(Promise.resolve(mockCamps)),
        populate: jest.fn().mockReturnThis(),
      });
  
      Camp.countDocuments.mockResolvedValue(50);
      getObjectSignedUrl.mockResolvedValue('https://signed-url.com/fake.jpg');
  
      const req = mockReq({
        query: { select: 'name', page: '1', limit: '2' },
        user: { id: 'mockUserId', role: 'owner' },
      });
  
      const res = mockRes();
  
      await getCamps(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: expect.any(Array),
      });
    });
  });
});
*/