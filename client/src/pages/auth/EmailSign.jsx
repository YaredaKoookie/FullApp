import { useForm } from 'react-hook-form';
import useMagicLinkSignIn from '@/hooks/useMagicLinkSignIn';

const EmailSign = ({ role }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const magicLinkMutation = useMagicLinkSignIn();

  const onSubmit = async (data) => {
    await magicLinkMutation.mutateAsync({ ...data, role });
  };

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            placeholder="me@example.com"
            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:border-indigo-500 focus:ring-indigo-500"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          className={`w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
            magicLinkMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={magicLinkMutation.isPending}
        >
          Send Magic Link
        </button>
      </form>
    </div>
  );
};

export default EmailSign;
