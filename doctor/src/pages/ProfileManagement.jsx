import React, { useState } from 'react';
import { DoctorLayout } from '../layouts/DoctorLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../lib/api';
import { toast } from 'react-hot-toast';
import { Camera, Plus, X, GraduationCap, Globe, Building2, DollarSign } from 'lucide-react';

const ProfileManagementContent = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    yearsOfExperience: 0,
    qualifications: [],
    languages: [],
    hospitalName: '',
    hospitalAddress: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Ethiopia',
      coordinates: [0, 0]
    },
    consultationFee: 0,
    serviceAreas: ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      // Transform data to match server's expected format
      const apiData = {
        bio: data.bio,
        yearsOfExperience: data.yearsOfExperience,
        qualifications: data.qualifications,
        languages: data.languages,
        hospitalName: data.hospitalName,
        hospitalAddress: data.hospitalAddress,
        consultationFee: data.consultationFee,
        serviceAreas: data.serviceAreas
      };
      
      console.log('Sending update data:', apiData);
      return adminAPI.doctor.updateProfile(apiData);
    },
    onSuccess: (response) => {
      console.log('Update successful, response:', response);
      // Force refetch the profile data
      queryClient.invalidateQueries(['doctorProfile']);
      // Update local state with the response data
      if (response?.data?.data) {
        const transformedData = {
          ...response.data.data,
          languages: response.data.data.languages || [],
          hospitalAddress: {
            ...response.data.data.hospitalAddress,
            coordinates: response.data.data.hospitalAddress?.coordinates || [0, 0]
          }
        };
        setFormData(transformedData);
      }
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: () => adminAPI.doctor.getProfileView(),
    onSuccess: (response) => {
      if (response?.data?.data) {
        const profileData = response.data.data;
        const transformedData = {
          bio: profileData.bio || '',
          yearsOfExperience: profileData.yearsOfExperience || 0,
          qualifications: profileData.qualifications || [],
          languages: profileData.languagesSpoken || [], // Keep languages for display only
          hospitalName: profileData.hospitalName || '',
          hospitalAddress: {
            street1: profileData.hospitalAddress?.street1 || '',
            street2: profileData.hospitalAddress?.street2 || '',
            city: profileData.hospitalAddress?.city || '',
            state: profileData.hospitalAddress?.state || '',
            postalCode: profileData.hospitalAddress?.postalCode || '',
            country: profileData.hospitalAddress?.country || 'Ethiopia',
            coordinates: profileData.hospitalAddress?.coordinates || [0, 0]
          },
          consultationFee: profileData.consultationFee || 0,
          serviceAreas: profileData.serviceAreas || ''
        };
        setFormData(transformedData);
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleQualificationChange = (index, field, value) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = {
      ...newQualifications[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: '', institution: '', year: '' }]
    }));
  };

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleLanguageChange = (e) => {
    const languages = e.target.value.split(',').map(lang => lang.trim());
    setFormData(prev => ({
      ...prev,
      languages: languages
    }));
  };

  const handleEditClick = () => {
    // When entering edit mode, ensure form data is set to current profile data
    if (profile?.data?.data) {
      const profileData = profile.data.data;
      const transformedData = {
        bio: profileData.bio || '',
        yearsOfExperience: profileData.yearsOfExperience || 0,
        qualifications: profileData.qualifications || [],
        languages: profileData.languagesSpoken || [],
        hospitalName: profileData.hospitalName || '',
        hospitalAddress: {
          street1: profileData.hospitalAddress?.street1 || '',
          street2: profileData.hospitalAddress?.street2 || '',
          city: profileData.hospitalAddress?.city || '',
          state: profileData.hospitalAddress?.state || '',
          postalCode: profileData.hospitalAddress?.postalCode || '',
          country: profileData.hospitalAddress?.country || 'Ethiopia',
          coordinates: profileData.hospitalAddress?.coordinates || [0, 0]
        },
        consultationFee: profileData.consultationFee || 0,
        serviceAreas: profileData.serviceAreas || ''
      };
      setFormData(transformedData);
    }
    setIsEditing(true);
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      // Send the file to the server
      const response = await adminAPI.doctor.updateProfile(formData);
      
      if (response?.data?.data) {
        // Update local state with new profile photo
        setFormData(prev => ({
          ...prev,
          profilePhoto: response.data.data.profilePhoto,
          profilePhotoId: response.data.data.profilePhotoId
        }));
        // Force refetch the profile data to update the view
        queryClient.invalidateQueries(['doctorProfile']);
        toast.success('Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast.error('Failed to update profile photo');
    }
  };

  if (error) {
    console.error('Query Error:', error);
    return (
      <div className="text-red-600 p-4">
        Error loading profile: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid gap-8">
          <div className="h-40 w-full bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-40 w-full bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }
  

  const profileData = profile?.data?.data;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
        <button
          onClick={handleEditClick}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-8">
              <div className="relative">
                <img 
                  src={profileData?.profilePicture?.url || '/default-avatar.png'} 
                  alt="Profile" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors duration-200">
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Profile Picture</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a professional photo of yourself</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Bio</h3>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows="4"
              placeholder="Write a brief professional bio..."
            />
          </div>

          {/* Experience */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Experience</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                min="0"
              />
            </div>
          </div>

          {/* Qualifications */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Qualifications</h3>
              </div>
              <button
                type="button"
                onClick={addQualification}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>Add Qualification</span>
              </button>
            </div>
            <div className="space-y-6">
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-4">
                    <input
                      type="text"
                      value={qual.degree}
                      onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                      placeholder="Degree"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <input
                      type="text"
                      value={qual.institution}
                      onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                      placeholder="Institution"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <input
                      type="text"
                      value={qual.year}
                      onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                      placeholder="Year"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Globe className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Languages Spoken</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages (comma-separated)</label>
              <input
                type="text"
                value={formData.languages.join(', ')}
                onChange={handleLanguageChange}
                placeholder="English, Spanish, French"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Hospital Information */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Hospital Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address 1</label>
                <input
                  type="text"
                  name="hospitalAddress.street1"
                  value={formData.hospitalAddress.street1}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address 2</label>
                <input
                  type="text"
                  name="hospitalAddress.street2"
                  value={formData.hospitalAddress.street2}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="hospitalAddress.city"
                  value={formData.hospitalAddress.city}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="hospitalAddress.state"
                  value={formData.hospitalAddress.state}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="hospitalAddress.postalCode"
                  value={formData.hospitalAddress.postalCode}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="hospitalAddress.country"
                  value={formData.hospitalAddress.country}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-8 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Areas</label>
              <input
                type="text"
                name="serviceAreas"
                value={formData.serviceAreas}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your service areas..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm disabled:opacity-50"
            >
              {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-8">
          {/* Profile Picture */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-8">
              <img 
                src={profileData?.profilePicture?.url || '/default-avatar.png'} 
                alt="Profile" 
                className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Profile Picture</h3>
                <p className="text-sm text-gray-500 mt-1">Your professional photo</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Bio</h3>
            <p className="text-gray-600 leading-relaxed">{profileData?.bio || 'No bio added yet'}</p>
          </div>

          {/* Experience & Qualifications */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Experience & Qualifications</h3>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{profileData?.yearsOfExperience || 0} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Qualifications</p>
                <div className="space-y-3">
                  {profileData?.qualifications?.map((qual, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{qual.degree}</p>
                      <p className="text-gray-600">{qual.institution}</p>
                      <p className="text-sm text-gray-500">{qual.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Languages & Service Areas */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Globe className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Languages & Service Areas</h3>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Languages Spoken</p>
                <div className="flex flex-wrap gap-2">
                  {profileData?.languagesSpoken?.map((lang, index) => (
                    <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Service Areas</p>
                <p className="mt-1 text-gray-900">{profileData?.serviceAreas || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Hospital Information */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Hospital Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Hospital Name</p>
                <p className="mt-1 text-gray-900">{profileData?.hospitalName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hospital Address</p>
                <p className="mt-1 text-gray-900">
                  {profileData?.hospitalAddress?.street1}
                  {profileData?.hospitalAddress?.street2 && `, ${profileData?.hospitalAddress?.street2}`}
                  {profileData?.hospitalAddress?.city && `, ${profileData?.hospitalAddress?.city}`}
                  {profileData?.hospitalAddress?.state && `, ${profileData?.hospitalAddress?.state}`}
                  {profileData?.hospitalAddress?.postalCode && ` ${profileData?.hospitalAddress?.postalCode}`}
                  {profileData?.hospitalAddress?.country && `, ${profileData?.hospitalAddress?.country}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Consultation Fee</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">${profileData?.consultationFee || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileManagement = () => {
  return (
    <DoctorLayout>
      <ProfileManagementContent />
    </DoctorLayout>
  );
};

export default ProfileManagement; 