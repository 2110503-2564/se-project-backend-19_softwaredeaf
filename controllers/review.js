const Review=require('../models/Review')
exports.getMyReview= async(req,res,next)=>{
  const myReview = await Review.find({ user: req.params.id }).populate({
    path:'user',
    select: "name"
  }).populate({
    path:'camp',
    select: "name"
  });

  if(!myReview){
    return res.status(400).json({
      message:'Fail to find review'
    })
  }

  return res.status(200).json({ success: true, data: myReview });
}

exports.getCampReview= async(req,res,next)=>{
  const campReview = await Review.find({ camp: req.params.id })
  if(campReview.length==0){
    return res.status(400).json({
      message:'Fail to find review'
    })
  }

  return res.status(200).json({ success: true, data: campReview });
}
