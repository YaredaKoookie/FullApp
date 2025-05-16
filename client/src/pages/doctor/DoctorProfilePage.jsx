import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { Camera, Pencil, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "react-toastify";
import useGetDoctorProfile from "@/hooks/useGetDoctorProfile";
import { useAuth } from "@/context/AuthContext";

const DoctorProfilePage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editableProfile, setEditableProfile] = useState(null);
  // const {user} = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useGetDoctorProfile();
  console.log("user ", profile);

  useEffect(() => {
    if (profile) {
      setEditableProfile({
        ...profile,
        qualifications: profile.qualifications.degree || [],
        languages: profile.languages || [],
        serviceAreas: profile.serviceAreas || [],
        hospitalAddress: profile.hospitalAddress || {
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        },
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (updatedProfile) =>
      apiClient.put(`/doctors/profile/update`, updatedProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const photoMutation = useMutation({
    mutationFn: (photoFile) => {
      // console.log(photoFile);
      const formData = new FormData();
      formData.append("profilePhoto", photoFile);
      return apiClient.put(`/doctors/profile/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
      toast.success("Profile photo updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to upload photo");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editableProfile) return;
    updateMutation.mutate(editableProfile);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setEditableProfile((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (field, value) => {
    setEditableProfile((prev) => ({
      ...prev,
      [field]: value ? value.split(",").map((item) => item.trim()) : [],
    }));
  };

  const handlePhotoChange = (e) => {
    console.log(e);
    if (e.target.files?.[0]) {
      photoMutation.mutate(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    setEditableProfile(profile);
    setIsEditing(false);
  };

  if (isProfileLoading || !editableProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Doctor Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Check size={16} />
              {updateMutation.isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex border-b border-gray-200">
            <Tab
              className={({ selected }) =>
                `px-4 py-3 font-medium text-sm focus:outline-none ${
                  selected
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              Personal Information
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-3 font-medium text-sm focus:outline-none ${
                  selected
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              Professional Details
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-3 font-medium text-sm focus:outline-none ${
                  selected
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              Practice Information
            </Tab>
          </Tab.List>
          <Tab.Panels className="p-6">
            {/* Personal Information Tab */}
            <Tab.Panel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="relative group">
                    <img
                      src={`http://localhost:3000${editableProfile.profilePhoto}`}
                      alt="Profile"
                      className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                        <Camera size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          name="profilePhoto"
                        />
                      </label>
                    )}
                  </div>
                  {photoMutation.isLoading && (
                    <div className="mt-2 text-sm text-gray-500">
                      Uploading photo...
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={editableProfile.firstName || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          {profile.firstName}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Middle Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="middleName"
                          value={editableProfile.middleName || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          {profile.middleName || "-"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={editableProfile.lastName || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          {profile.lastName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          name="gender"
                          value={editableProfile.gender || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md capitalize">
                          {profile.gender}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={editableProfile.dateOfBirth || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          {profile.dateOfBirth || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Professional Details Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="specialization"
                      value={editableProfile.specialization || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      {profile.specialization}
                    </div>
                  )}
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifications
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={(editableProfile.qualifications || []).join(
                          ", "
                        )}
                        onChange={(e) =>
                          handleArrayChange("qualifications", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="MD, PhD, etc. (comma separated)"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Separate multiple qualifications with commas
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      {profile.qualifications?.length > 0
                        ? profile.qualifications.join(", ")
                        : "None specified"}
                    </div>
                  )}
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="yearsOfExperience"
                        value={editableProfile.yearsOfExperience || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md">
                        {profile.yearsOfExperience}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={(editableProfile.languages || []).join(", ")}
                          onChange={(e) =>
                            handleArrayChange("languages", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="English, Spanish, etc."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Separate languages with commas
                        </p>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md">
                        {profile.languages?.length > 0
                          ? profile.languages.join(", ")
                          : "None specified"}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={editableProfile.bio || ""}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-md whitespace-pre-line">
                      {profile.bio || "No bio provided"}
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>

            {/* Practice Information Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="hospitalName"
                      value={editableProfile.hospitalName || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      {profile.hospitalName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Address
                  </label>
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editableProfile.hospitalAddress?.street || ""}
                        onChange={(e) =>
                          handleNestedChange(
                            "hospitalAddress",
                            "street",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Street address"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={editableProfile.hospitalAddress?.city || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "hospitalAddress",
                              "city",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={editableProfile.hospitalAddress?.state || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "hospitalAddress",
                              "state",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="State/Province"
                        />
                        <input
                          type="text"
                          value={
                            editableProfile.hospitalAddress?.postalCode || ""
                          }
                          onChange={(e) =>
                            handleNestedChange(
                              "hospitalAddress",
                              "postalCode",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Postal Code"
                        />
                      </div>
                      {/* <select
                        value={editableProfile.hospitalAddress?.country || ""}
                        onChange={(e) =>
                          handleNestedChange(
                            "hospitalAddress",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Country</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                      </select> */}
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      {[
                        profile.hospitalAddress?.street,
                        profile.hospitalAddress?.city,
                        profile.hospitalAddress?.state,
                        profile.hospitalAddress?.postalCode,
                        profile.hospitalAddress?.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={editableProfile.phoneNumber || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md">
                        {profile.phoneNumber}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consultation Fee
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          name="consultationFee"
                          value={editableProfile.consultationFee || ""}
                          onChange={handleChange}
                          className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md">
                        ${profile.consultationFee}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Areas
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={(editableProfile.serviceAreas || []).join(", ")}
                        onChange={(e) =>
                          handleArrayChange("serviceAreas", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City, Region, etc."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Separate service areas with commas
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      {profile.serviceAreas?.length > 0
                        ? profile.serviceAreas.join(", ")
                        : "None specified"}
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
