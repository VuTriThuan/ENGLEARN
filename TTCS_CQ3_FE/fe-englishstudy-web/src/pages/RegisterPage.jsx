import { toast } from 'react-hot-toast';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { register as apiRegister } from '../utils/services/authService';

function RegisterPage({ onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    date_of_birth: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    date_of_birth: '',
    password: '',
    confirmPassword: ''
  });

  
  const todayStr = new Date().toISOString().split('T')[0];

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (pass) => {
    if (pass.length > 0 && pass.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'date_of_birth') {
      if (value && value > todayStr) {
        setErrors(prev => ({ ...prev, date_of_birth: 'Ngày sinh không được là ngày trong tương lai.' }));
      } else {
        setErrors(prev => ({ ...prev, date_of_birth: '' }));
      }
    }

    if (name === 'password') {
      const passError = validatePassword(value);
      setErrors(prev => ({ ...prev, password: passError }));
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Mật khẩu xác nhận không khớp.' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Mật khẩu xác nhận không khớp.' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.date_of_birth) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    
    if (formData.date_of_birth > todayStr) {
      setErrors(prev => ({ ...prev, date_of_birth: 'Ngày sinh không được là ngày trong tương lai.' }));
      toast.error('Ngày sinh không hợp lệ!');
      return;
    }

    const passError = validatePassword(formData.password);
    if (passError || formData.password !== formData.confirmPassword || !formData.password) {
      toast.error("Vui lòng kiểm tra lại thông tin mật khẩu!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRegister({
        fullName: formData.fullName,
        dateOfBirth: formData.date_of_birth,
        email: formData.email,
        password: formData.password,
        retypePassword: formData.confirmPassword
      });
      toast.success("Đăng ký tài khoản thành công! Mời bạn đăng nhập.");
      onNavigateToLogin();
    } catch (err) {
      toast.error("Đăng ký thất bại. Vui lòng thử lại hoặc kiểm tra thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164e63] py-8">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-[#083344]">EngLearn</h1>
          <p className="text-gray-500 mt-2">Tạo tài khoản mới</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-[#164e63] mb-1">Họ và tên đầy đủ</label>
            <input
              type="text" name="fullName"
              value={formData.fullName} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0284c7] outline-none"
              placeholder="Ví dụ: Nguyễn Văn A" required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Ngày sinh</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              max={todayStr}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:border-cyan-500 outline-none transition-all ${
                errors.date_of_birth
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-cyan-500'
              }`}
            />
            {errors.date_of_birth && (
              <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center">
                <span className="mr-1">⚠️</span> {errors.date_of_birth}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#164e63] mb-1">Email</label>
            <input
              type="email" name="email"
              value={formData.email} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0284c7] outline-none"
              placeholder="email@example.com" required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#164e63] mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password} onChange={handleChange}
                className={`w-full pl-4 pr-12 py-2.5 rounded-lg border focus:ring-2 outline-none transition-all ${errors.password ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-[#0284c7]'}`}
                placeholder="••••••••" required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#083344] focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center">
                <span className="mr-1">⚠️</span> {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#164e63] mb-1">Xác nhận lại mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                className={`w-full pl-4 pr-12 py-2.5 rounded-lg border focus:ring-2 outline-none transition-all ${errors.confirmPassword ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-[#0284c7]'}`}
                placeholder="••••••••" required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#083344] focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center">
                <span className="mr-1">⚠️</span> {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg text-white ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0e7490] hover:bg-[#164e63]'}`}
            >
              {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký ngay'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-900 mt-6">
          Đã có tài khoản?
          <button
            onClick={onNavigateToLogin}
            className="text-[#0369a1] font-semibold hover:underline ml-1 focus:outline-none"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;