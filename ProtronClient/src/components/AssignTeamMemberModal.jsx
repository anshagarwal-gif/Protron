import React, { useEffect, useState } from 'react';
import { FiX, FiChevronDown, FiCalendar } from 'react-icons/fi';

const AssignTeamMemberModal = ({ users, isOpen, onClose, projectName, onAddMember }) => {
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeCode: '',
    taskType: '',
    unit: '',
    cost: 0,
    releaseDate: '',
    tasktype: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      const user = users.find((user) => user.email === value);
      if (user) {
        setFormData({
          ...formData,
          email: value,
          name: user.firstName + user.lastName,
          employeeCode: user.empCode
        })
        setError(null);
      } else {
        setFormData({
          ...formData,
          email: value,
          name: '',
          employeeCode: ''
        });
        setError('User not found');
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
      taskType: '',
      unit: '',
      cost: 0,
      releaseDate: '',
      tasktype: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log('Form submitted:', formData);
    onAddMember(formData);
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-3xl">
        {/* Modal Header */}
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-medium text-gray-800">
            Assign Team Member | {projectName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Email Section */}
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">Email</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="w-full border rounded p-2"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            {/* Name Section */}
            <div className='flex justify-between items-center w-full'>
              <div className="mb-6">
                <label className="block text-gray-600 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled
                  placeholder="Name will be auto-filled"
                  className="w-full border rounded p-2 bg-gray-100"
                />
              </div>

              {/* Employee Code Section */}
              <div className="mb-6">
                <label className="block text-gray-600 mb-2">Employee Code</label>
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  disabled
                  placeholder="Employee Code will be auto-filled"
                  className="w-full border rounded p-2 bg-gray-100"
                />
              </div>

              <div className='mb-6'>
                <label className="block text-gray-600 mb-2">Task Type</label>
                <div className="">
                  <select
                    name="tasktype"
                    value={formData.tasktype}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  >
                    <option value="" disabled>Select Task Type</option>
                    <option value="Develop">Develop</option>
                    <option value="Design">Design</option>
                    <option value="Test">Test</option>
                  </select>
                </div>
              </div>
            </div>


            {/* Pricing Section */}
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-4">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">Unit</label>
                  <div className="relative">
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    >
                      <option value="" disabled>Select Unit</option>
                      <option value="Rupees">Rupees</option>
                      <option value="Dollar">Dollar</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Cost</label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="Enter text"
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>

            {/* Release Details Section */}
            <div className="mb-8">
              <h3 className="text-gray-700 font-medium mb-4">Release Details</h3>
              <div>
                <label className="block text-gray-600 mb-2">Estimated Release Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 text-green-900 hover:text-gray-800"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-900 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Example of how to use this component in a parent component
const ParentComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddMember = (memberData) => {
    console.log('New team member data:', memberData);
    // Process the data as needed
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Add Team Member
      </button>

      <AssignTeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectName="Project Name"
        onAddMember={handleAddMember}
      />
    </div>
  );
};

export default AssignTeamMemberModal;