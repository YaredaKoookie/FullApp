import React from "react";
import { DoctorLayout } from "../layouts/DoctorLayout";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  Star,
  Filter,
  Calendar,
  Search,
  User,
  ChevronDown,
  Check,
  MessageSquare,
  Edit2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";

const ReviewsRatings = () => {
  // const fetchReviews = async (params = {}) => {
  //   const queryString = new URLSearchParams(params).toString();
  //   const response = await fetch(`/api/doctors/reviews?${queryString}`);
  //   if (!response.ok) throw new Error("Failed to fetch reviews");
  //   return response.json();
  // };
  const { data: fetchReviews } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      console.log("Fetching current user...");
      const response = await adminAPI.reviews.getReviews();
      console.log("Current user response:", response);
      return response;
    },
    onError: (error) => {
      console.error("Error fetching current user:", error);
      toast.error("Failed to fetch user information");
    },
  });

  const [filters, setFilters] = useState({
    rating: "",
    tags: [],
    anonymous: false,
    startDate: "",
    endDate: "",
    search: "",
    sort: "-createdAt",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reviews", filters],
    queryFn: () => fetchReviews(filters),
    keepPreviousData: true,
  });

  const toggleTag = (tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (isError)
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
        <span>Failed to load reviews</span>
      </div>
    );
  return (
    <DoctorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Patient Reviews
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rating Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Star className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-600">
                  Average Rating
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {data?.averageRating?.toFixed(1) || "0.0"}
              </div>
            </div>

            {/* Total Reviews */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <MessageSquare className="w-6 h-6 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">
                  Total Reviews
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {data?.totalReviews || 0}
              </div>
            </div>

            {/* Top Tags */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Filter className="w-6 h-6 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-600">
                  Top Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data?.topTags?.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      filters.tags.includes(tag)
                        ? "bg-purple-600 text-white"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Rating Filter */}
            <Listbox
              value={filters.rating}
              onChange={(val) => handleFilterChange("rating", val)}
            >
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
                  <span className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    {filters.rating
                      ? `${filters.rating} Star${filters.rating > 1 ? "s" : ""}`
                      : "All Ratings"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                    <Listbox.Option
                      value=""
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            All Ratings
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <Check className="h-5 w-5" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Listbox.Option
                        key={rating}
                        value={rating}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {rating} Star{rating > 1 ? "s" : ""}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>

            {/* Date Range */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="bg-white border rounded-lg pl-10 p-2 w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="bg-white border rounded-lg pl-10 p-2 w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white border rounded-lg pl-10 p-2 w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search reviews..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymousFilter"
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={filters.anonymous}
                onChange={(e) =>
                  handleFilterChange("anonymous", e.target.checked)
                }
              />
              <label
                htmlFor="anonymousFilter"
                className="ml-2 block text-sm text-gray-700"
              >
                Anonymous Only
              </label>
            </div>
          </div>
        </div>

        {/* Review List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center">
              <Clock className="animate-spin w-5 h-5 mr-2" />
              Loading reviews...
            </div>
          ) : data?.reviews?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No reviews found matching your criteria
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {data?.reviews?.map((review) => (
                <li
                  key={review._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="flex mr-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {review.edited && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edited
                          </span>
                        )}
                      </div>

                      <div className="flex items-center mb-3">
                        {review.patient && !review.anonymous ? (
                          <>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 mr-2 overflow-hidden">
                              {review.patient.profilePhoto ? (
                                <img
                                  src={review.patient.profilePhoto}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <span className="font-medium text-gray-900">
                              {review.patient.firstName}{" "}
                              {review.patient.lastName}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            <User className="w-4 h-4 inline mr-1" />
                            Anonymous Patient
                          </span>
                        )}
                      </div>

                      {review.appointment && (
                        <div className="text-sm text-gray-500 mb-3">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {new Date(
                            review.appointment.date
                          ).toLocaleDateString()}
                          {review.appointment.serviceType &&
                            ` • ${review.appointment.serviceType}`}
                        </div>
                      )}

                      {review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {review.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {review.reviewText && (
                        <p className="text-gray-700 mb-3 whitespace-pre-line">
                          {review.reviewText}
                        </p>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {review.response?.byDoctor && (
                    <div className="mt-4 pl-4 border-l-4 border-blue-200 bg-blue-50 p-3 rounded">
                      <div className="font-semibold text-blue-800 mb-1 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Your Response
                      </div>
                      <p className="text-blue-700 whitespace-pre-line">
                        {review.response.byDoctor}
                      </p>
                      {review.response.respondedAt && (
                        <div className="text-xs text-blue-600 mt-1">
                          {new Date(
                            review.response.respondedAt
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default ReviewsRatings;
