const Booking = require('../models/Booking.js');
const Camp = require('../models/Camp.js');
const { generateFileName, uploadFile, getObjectSignedUrl, deleteFile } = require('./s3.js');

//@desc     Get all camps
//@route    GET /api/v1/camps
//@access   Public
exports.getCamps = async (req, res, next) => {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    if (req.user && req.user.role === 'owner') {
        reqQuery.owner = req.user.id;
    }

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Camp.find(JSON.parse(queryStr)).populate('bookings');

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    try {
        const total = await Camp.countDocuments();
        query = query.skip(startIndex).limit(limit);

        const camps = await query;

        const pagination = {};
        
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        for(let eachCampground of camps){
            if(eachCampground.picture && !eachCampground.picture.startsWith('http')){
                eachCampground.picture = await getObjectSignedUrl(eachCampground.picture);
            }
        }

        res.status(200).json({
            success: true,
            count: camps.length,
            data: camps
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false });
    }
};

//@desc     Get single camps
//@route    GET /api/v1/camps/:id
//@access   Public
exports.getCamp = async(req,res,next)=>{
    try {
        const camp = await Camp.findById(req.params.id);

        if(!camp) {
            return res.status(404).json({success:false});
        }
        
        if(camp.picture && !camp.picture.startsWith('http')){
            camp.picture = await getObjectSignedUrl(camp.picture);
        }
        
        res.status(200).json({
            success:true,
            data:camp
        });
    } catch(err) {
        return res.status(400).json({success:false});
    }
};

//@desc     Create new camps
//@route    POST /api/v1/camps
//@access   Private
exports.createCamp = async (req, res, next) => {
    try {
      // เพิ่ม owner ลงไปใน req.body
      req.body.owner = req.user.id;

      if(req.file){
        const imageName = generateFileName();
        await uploadFile(req.file,imageName,req.file.mimetype);
        req.body.picture = imageName;
      }

      const camp = await Camp.create(req.body);

      res.status(201).json({
        success: true,
        data: camp,
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({
        success: false,
        message: 'Failed to create camp',
      });
    }
  };

//@desc     Update new camps
//@route    PUT /api/v1/camps/:id
//@access   Private
exports.updateCamp = async(req,res,next)=>{
    try {

        let camp = await Camp.findById(req.params.id);

            if(!camp) {
                return res.status(404).json({
                    success: false,
                    message: `No campground with the id of ${req.params.id}`
                });
            }

            //Make sure user is the booking owner
            if(camp.owner.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: `User ${req.user.id} is not authorized to update this booking`
                });
            }

            if(req.file){
                const imageName = generateFileName();
                await deleteFile(camp.picture);
                await uploadFile(req.file,imageName,req.file.mimetype);
                req.body.picture = imageName;
            }

        camp = await Camp.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators:true
        });

        res.status(200).json({
            success:true,
            data: camp
        });
    } catch(err) {
        res.status(400).json({success:false});
    }
};

//@desc     Delete new camps
//@route    DELETE /api/v1/camps/:id
//@access   Private
exports.deleteCamp = async (req, res, next) => {
    try {
        let camp = await Camp.findById(req.params.id);

        if (!camp) {
            return res.status(404).json({
                success: false,
                message: `No campground with the id of ${req.params.id}`
            });
        }

        // Make sure user is the booking owner
        if ((!camp.owner|| camp.owner.toString() !== req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this campground`
            });
        }

        let deleteImage = camp.picture;


        await Booking.deleteMany({ camp: req.params.id });
        await Camp.deleteOne({ _id: req.params.id });

        if(deleteImage && !deleteImage.startsWith('http')){
            await deleteFile(deleteImage);
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        // Log the error to see the full details
        console.error('Error in deleteCamp:', err);

        // Provide a more detailed error message
        return res.status(400).json({
            success: false,
            message: err.message || 'Something went wrong'
        });
    }
};
