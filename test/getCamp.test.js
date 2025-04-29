const { getCamp } = require('../controllers/camps');
const Camp = require('../models/Camp');
const { getObjectSignedUrl } = require('../controllers/s3');

jest.mock('../models/Camp');
jest.mock('../controllers/s3');

describe('getCamp', () => {
  it('should return camp data with signed URL if picture is not a full URL', async () => {
    const mockCamp = {
      _id: 'abc123',
      picture: 'image123.png',
      toObject: () => this
    };

    const req = { params: { id: 'abc123' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Camp.findById.mockResolvedValue(mockCamp);
    getObjectSignedUrl.mockResolvedValue('https://signed-url.com/image123.png');

    await getCamp(req, res);

    expect(Camp.findById).toHaveBeenCalledWith('abc123');
    expect(getObjectSignedUrl).toHaveBeenCalledWith('image123.png');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        ...mockCamp,
        picture: 'https://signed-url.com/image123.png'
      }
    });
  });

  it('should return 404 if camp not found', async () => {
    const req = { params: { id: 'notexist' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Camp.findById.mockResolvedValue(null);

    await getCamp(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false });
  });
});