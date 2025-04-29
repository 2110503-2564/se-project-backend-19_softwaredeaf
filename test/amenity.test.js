const { getAmenity, addAmenities, updateAmenity, deleteAmenity} = require("../controllers/amenity");
const Amenity = require("../models/CampgroundAmenity");
const { getObjectSignedUrl } = require("../controllers/s3");
const Camp = require("../models/Camp");

jest.mock("../models/Camp");
jest.mock("../models/CampgroundAmenity");
jest.mock("../controllers/s3");

describe("getAmenity", () => {
  it("should return amenities with signed image URLs", async () => {
    const req = { params: { campId: "camp123" } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    const next = jest.fn();

    const mockAmenity = [
      { image: "image-key-1", campgroundId: "camp123" },
      { image: null, campgroundId: "camp123" },
    ];

    Amenity.find.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(mockAmenity),
    }));
    getObjectSignedUrl.mockResolvedValue("https://signed-url.com/image-key-1");

    await getAmenity(req, res, next);

    expect(getObjectSignedUrl).toHaveBeenCalledWith("image-key-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: [
        { image: "https://signed-url.com/image-key-1", campgroundId: "camp123" },
        { image: null, campgroundId: "camp123" },
      ],
    });
  });

  it("should return 500 on error", async () => {
    const req = { params: { campId: "camp123" } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    const next = jest.fn();

    Amenity.find.mockImplementation(() => {
      throw new Error("DB Error");
    });

    await getAmenity(req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: expect.any(Error),
    });
  });
});

describe("addAmenities", () => {
    it("should create an amenity and return success", async () => {
      const req = {
        params: { campId: "camp123" },
        user: { id: "user123", role: "user" },
        body: { name: "WiFi", image: "wifi.png", campgroundId: "camp123" },
      };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const next = jest.fn();
  
      Camp.findById = jest.fn().mockResolvedValue({
        owner: "user123",
      });
  
      Amenity.create = jest.fn().mockResolvedValue(req.body);
  
      await addAmenities(req, res, next);
  
      expect(Amenity.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: req.body,
      });
    });
  
    it("should return 400 on error", async () => {
      const req = {
        params: { campId: "camp123" },
        user: { id: "user123", role: "user" },
        body: { name: "WiFi", image: "wifi.png", campgroundId: "camp123" },
      };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const next = jest.fn();
  
      Camp.findById = jest.fn().mockResolvedValue({
        owner: "user123",
      });
  
      Amenity.create = jest.fn().mockRejectedValue(new Error("Insert failed"));
  
      await addAmenities(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
      });
    });
  });  
/*
describe("updateAmenity", () => {
    it("should update an amenity and return success", async () => {
        const req = {
            body: { name: "NewName", image: "newImage.jpg" },
            params: { amenityId: "a1" },
        };
        const json = jest.fn();
        const status = jest.fn(() => ({ json }));
        const res = { status };
        const next = jest.fn();

        // Mocking the update method to return an updated doc
        const updatedDoc = {
            _id: "a1",
            name: "NewName",
            image: "newImage.jpg",
        };
        Amenity.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedDoc);

        await updateAmenity(req, res, next);

        // Ensure that findByIdAndUpdate is called with the correct parameters
        expect(Amenity.findByIdAndUpdate).toHaveBeenCalledWith(
            "a1",
            { name: "NewName", image: "newImage.jpg" },
            { new: true }
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            data: updatedDoc,
        });
    });

    it("should return 500 on error", async () => {
        const req = {
            body: { name: "NewName" },
            params: { amenityId: "a1" },
        };
        const json = jest.fn();
        const status = jest.fn(() => ({ json }));
        const res = { status };
        const next = jest.fn();

        // Mocking the update method to throw an error
        Amenity.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Update error"));

        await updateAmenity(req, res, next);

        // Ensure that error handling returns the correct status and message
        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            success: false,
            message: "Update error", // Show the error message correctly
        });
    });
});
  
describe("deleteAmenity", () => {
    it("should delete amenity and return success", async () => {
      const req = { params: { amenityId: "a1" } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status };
      const next = jest.fn();
  
      Amenity.findByIdAndDelete.mockResolvedValue("deleted");
  
      await deleteAmenity(req, res, next);
  
      expect(Amenity.findByIdAndDelete).toHaveBeenCalledWith("a1");
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ success: true });
    });
  
    it("should return 500 on error", async () => {
      const req = { params: { amenityId: "a1" } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status };
      const next = jest.fn();
  
      Amenity.findByIdAndDelete.mockRejectedValue(new Error("Delete failed"));
  
      await deleteAmenity(req, res, next);
  
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(Error),
      });
    });
  });
  */