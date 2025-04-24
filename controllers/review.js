const Review=require('../models/Review')
exports.getMyReview = async (req, res, next) => {
  try {

    if (req.user.id !== req.params.id &&req.user.role!="admin") {
      return res.status(403).json({
        message: 'You are not authorized to view these reviews.'
      });
    }

    const myReview = await Review.find({ user: req.params.id }).populate({
      path: 'user',
      select: "name"
    }).populate({
      path: 'camp',
      select: "name"
    });

    if (myReview.length == 0 || !myReview) {
      return res.status(400).json({
        message: 'Fail to find review'
      })
    }

    return res.status(200).json({ success: true, data: myReview });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server error'
    });
  }
}

exports.getCampReview= async(req,res,next)=>{
  try {
    const campReview = await Review.find({ camp: req.params.id })
    if (campReview.length == 0 || !campReview) {
      return res.status(404).json({
        message: 'Fail to find review'
      })
    }

    return res.status(200).json({ success: true, data: campReview });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server error'
    });
  }
}

exports.createReview = async(req,res,next) =>{
  try {
    const review = await Review.create(req.body);
    res.status(201).json({
      success: true,
      data: review,
    });
  }
  catch(err){
    console.log(err);
    res.status(500).json({
      message: 'Fail to add review'
    });
  }
}
