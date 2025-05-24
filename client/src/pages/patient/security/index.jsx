import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Shield, 
  Lock, 
  LogOut, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Globe,
  Laptop,
  Tablet,
  Monitor,
  ArrowRight
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@api/apiClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const passwordSchema = z.object({
  currentPassword: z.string()
    .min(1, "Current password is required")
    .optional(),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });
  }
  
  if (data.isPasswordSet && !data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Current password is required",
      path: ["currentPassword"]
    });
  }
});

const PasswordRequirement = ({ met, text }) => (
  <div className="flex items-center gap-2">
    {met ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-300" />
    )}
    <span className={`text-sm ${met ? "text-green-600" : "text-gray-500"}`}>
      {text}
    </span>
  </div>
);

const PasswordRequirements = ({ password = "" }) => {
  const requirements = [
    { met: password.length >= 8, text: "At least 8 characters long" },
    { met: /[A-Z]/.test(password), text: "At least one uppercase letter (A-Z)" },
    { met: /[a-z]/.test(password), text: "At least one lowercase letter (a-z)" },
    { met: /[0-9]/.test(password), text: "At least one number (0-9)" },
    { met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password), text: "At least one special character" },
  ];

  return (
    <div className="bg-blue-50 p-4 rounded-lg mt-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-medium text-blue-900">Password Requirements</h4>
          <div className="space-y-1">
            {requirements.map((req, index) => (
              <PasswordRequirement key={index} met={req.met} text={req.text} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityCard = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const SecurityPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("overview");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const {logout } = useAuth();


  // User data query
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await apiClient.get("/auth/me");
      return response.data?.user;
    },
  });

  // Sessions data query
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await apiClient.get("/auth/sessions");
      return response.data?.sessions || [];
    },
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("newPassword", "");

  // Password mutation
  const passwordMutation = useMutation({
    mutationFn: (data) => {
      const endpoint = user?.isPasswordSet ? "/auth/change-password" : "/auth/set-password";
      const payload = user?.isPasswordSet 
        ? { currentPassword: data.currentPassword, newPassword: data.newPassword, confirmPassword: data.confirmPassword }
        : { password: data.newPassword };
      
      return apiClient.post(endpoint, payload);
    },
    onSuccess: () => {
      toast.success(`Password ${user?.isPasswordSet ? "changed" : "set"} successfully`);
      reset();
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update password");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: (sessionId) => 
      sessionId 
        ? apiClient.delete(`/auth/sessions/${sessionId}`)
        : apiClient.delete("/auth/sessions"),
    onSuccess: () => {
      toast.success("Logged out successfully");
      queryClient.invalidateQueries(["sessions"]);
      logout();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to logout");
    },
  });

  const onSubmit = (data) => {
    passwordMutation.mutate(data);
  };

  // Device information helper
  const getDeviceInfo = (session) => {
    const device = session.device || {};
    const parts = [
      device.browser,
      device.os,
      device.model
    ].filter(Boolean);
    
    const icon = () => {
      if (!device.type) return <Monitor className="h-5 w-5" />;
      switch (device.type.toLowerCase()) {
        case 'mobile': return <Smartphone className="h-5 w-5" />;
        case 'tablet': return <Tablet className="h-5 w-5" />;
        case 'desktop': return <Laptop className="h-5 w-5" />;
        default: return <Monitor className="h-5 w-5" />;
      }
    };
    
    return {
      name: parts.length ? parts.join(" - ") : "Unknown Device",
      icon: icon(),
      isCurrent: session.isCurrent,
      createdAt: session.createdAt,
      location: session.address?.city && session.address?.country
        ? `${session.address.city}, ${session.address.country}`
        : "Unknown Location"
    };
  };

  // Password requirements
  const passwordRequirements = [
    { met: newPassword.length >= 8, text: "At least 8 characters long" },
    { met: /[A-Z]/.test(newPassword), text: "At least one uppercase letter" },
    { met: /[a-z]/.test(newPassword), text: "At least one lowercase letter" },
    { met: /[0-9]/.test(newPassword), text: "At least one number" },
    { met: /[@$!%*?&]/.test(newPassword), text: "At least one special character" },
  ];
  

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
              <p className="text-gray-500 mt-1">
                Manage your account security settings and active sessions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-1">
                {[
                  { id: "overview", label: "Security Overview", icon: Shield },
                  { id: "password", label: "Password & Recovery", icon: Lock },
                  { id: "sessions", label: "Active Sessions", icon: LogOut },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === item.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            {activeSection === "overview" && (
              <>
                <SecurityCard
                  title="Security Status"
                  description="Your account security overview"
                  icon={Shield}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Email Verified</h4>
                          <p className="text-sm text-gray-500">Your email is verified</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Two-Factor Auth</h4>
                          <p className="text-sm text-gray-500">Not enabled</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSection("password")}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                      >
                        Enable
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </SecurityCard>

                <SecurityCard
                  title="Recent Activity"
                  description="Your recent security-related activities"
                  icon={Clock}
                >
                  <div className="space-y-3">
                    {Array.isArray(sessions) && sessions.slice(0, 3).map((session) => {
                      const { name, icon, isCurrent, createdAt, location } = getDeviceInfo(session);
                      return (
                        <div key={session._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {icon}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {name}
                              </p>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {location}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4" />
                                {new Date(createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SecurityCard>
              </>
            )}

            {/* Password Section */}
            {activeSection === "password" && (
            <SecurityCard
            title={user?.isPasswordSet ? "Change Password" : "Set Password"}
            description={
              user?.isPasswordSet 
                ? "Update your existing password" 
                : "Create a password for your account"
            }
            icon={Lock}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {user?.isPasswordSet && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    {...register("currentPassword")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="current-password"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>
              )}
        
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {user?.isPasswordSet ? "New Password" : "Create Password"}
                </label>
                <input
                  type="password"
                  {...register("newPassword")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="new-password"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
        
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm {user?.isPasswordSet ? "New Password" : "Password"}
                </label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
        
              <PasswordRequirements password={newPassword} />
        
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordMutation.isPending
                  ? (user?.isPasswordSet ? "Changing..." : "Setting...")
                  : (user?.isPasswordSet ? "Change Password" : "Set Password")}
              </button>
            </form>
          </SecurityCard>
            )}

            {/* Sessions Section */}
            {activeSection === "sessions" && (
              <SecurityCard
                title="Active Sessions"
                description="Manage your active sessions across devices"
                icon={LogOut}
              >
                <div className="space-y-4">
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout Current Session
                    </button>
                    <button
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {logoutMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4" />
                          Logout All Sessions
                        </>
                      )}
                    </button>
                  </div>

                  {isLoadingSessions ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : sessions?.length > 0 ? (
                    sessions?.map((session) => {
                      const { name, icon, isCurrent, createdAt, location } = getDeviceInfo(session);
                      return (
                        <div
                          key={session._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg">
                              {icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{name}</span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  {location}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          {!isCurrent && (
                            <button
                              onClick={() => logoutMutation.mutate(session._id)}
                              disabled={logoutMutation.isPending}
                              className="text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active sessions found
                    </div>
                  )}
                </div>
              </SecurityCard>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You are about to logout from this device. You will be redirected to the home page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logoutMutation.mutate();
                }}
                disabled={logoutMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {logoutMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Logging out...
                  </>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPage;