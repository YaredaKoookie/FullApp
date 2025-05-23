import Review from '../../models/review.model';
import Doctor from '../../models/doctors/doctor.model';

export const getReviews = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    
    // Get doctor details for verification
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Parse query parameters
    const { 
      rating, 
      tags, 
      anonymous, 
      startDate, 
      endDate, 
      search,
      sort = '-createdAt' // Default sort by newest first
    } = req.query;

    // Build filter object
    const filter = { 
      doctor: doctorId,
      // Add status filter if your reviews have approval status
      // status: 'approved' 
    };

    // Apply filters
    if (rating) filter.rating = parseInt(rating);
    if (tags) filter.tags = { $in: tags.split(',') };
    if (anonymous) filter.anonymous = anonymous === 'true';
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      filter.$or = [
        { reviewText: { $regex: search, $options: 'i' } },
        { 'response.byDoctor': { $regex: search, $options: 'i' } }
      ];
    }

    // Get reviews with populated patient data (unless anonymous)
    const reviews = await Review.find(filter)
      .sort(sort)
      .populate({
        path: 'patient',
        select: 'firstName lastName profilePhoto',
        match: { anonymous: { $ne: true } }
      })
      .populate('appointment', 'date serviceType')
      .lean();

    // Calculate statistics
    const stats = await Review.getAverageRating(doctorId);
    const tagStats = await Review.aggregate([
      { $match: { doctor: doctorId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      averageRating: stats.avgRating,
      totalReviews: stats.count,
      topTags: tagStats.map(tag => tag._id),
      reviews: reviews.map(review => ({
        ...review,
        patient: review.anonymous ? null : review.patient
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
