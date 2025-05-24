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
      search,  // Keeping search for potential server-side use
      sort = '-createdAt', // Default sort by newest first
      page = 1, // Default page
      limit = 10 // Default page size
    } = req.query;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { 
      doctor: doctor._id,
      // Add status filter if your reviews have approval status
      // status: 'approved' 
    };

    // Apply filters
    if (rating) filter.rating = parseInt(rating);
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : tags.split(',') };
    
    // Note: Search is now handled client-side, but keeping the option for server-side
    if (search) {
      filter.$or = [
        { reviewText: { $regex: search, $options: 'i' } },
        { 'response.byDoctor': { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count of reviews (for pagination)
    const totalReviews = await Review.countDocuments(filter);

    // Get paginated reviews with populated patient data
    const reviews = await Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'patient',
        select: 'firstName lastName profilePhoto'
      })
      .populate('appointment', 'date serviceType')
      .lean();

    // Calculate statistics (using same filter for consistency)
    const stats = await Review.aggregate([
      { 
        $match: filter 
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const tagStats = await Review.aggregate([
      { $match: filter },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Extract statistics from aggregation result
    const statistics = stats[0] || { avgRating: 0, count: 0 };

    res.json({
      averageRating: statistics.avgRating ? parseFloat(statistics.avgRating.toFixed(1)) : 0,
      totalReviews: totalReviews, // Using the total count from countDocuments
      topTags: tagStats.map(tag => tag._id),
      reviews: reviews.map(review => ({
        ...review,
        // Convert dates to ISO strings for consistent client-side handling
        createdAt: review.createdAt.toISOString(),
        ...(review.appointment?.date && { 
          appointment: {
            ...review.appointment,
            date: review.appointment.date.toISOString()
          }
        }),
        ...(review.response?.respondedAt && {
          response: {
            ...review.response,
            respondedAt: review.response.respondedAt.toISOString()
          }
        })
      }))
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching reviews',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};