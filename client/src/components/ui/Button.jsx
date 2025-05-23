export const Button = ({ variant = "primary", children, ...props }) => {
  const baseClasses =
    "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none";

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "border border-gray-200 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-indigo-600 text-indigo-600 hover:bg-indigo-100",
    ghost: "text-gray-600 hover:bg-gray-100",
  };

  const classes = `${baseClasses} ${variants[variant]}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

