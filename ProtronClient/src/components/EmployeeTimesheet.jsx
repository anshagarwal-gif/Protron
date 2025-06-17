import React, { useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaDownload,
  FaCopy,
  FaPlus,
  FaUser,
  FaClock,
  FaEdit
} from 'react-icons/fa';
import LogTimeModal from './LogTimeModal'; // Import the modal component

export default function TimesheetApp() {
  const [currentView, setCurrentView] = useState('Monthly');
  const [currentWeek, setCurrentWeek] = useState('01/Jan/25 - 31/Jan/25');
  const [showWeekend, setShowWeekend] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeEntries, setTimeEntries] = useState({
    'Mon, 1 Jan': [
      {
        project: 'ireframe P1',
        task: 'Design',
        time: '02:30',
        percentage: 33,
        description: 'Show detailed description...'
      }
    ]
  });

  const days = [
    { name: 'Mon, 1 Jan', hours: '5H/8H', progress: 62.5 },
    { name: 'Tue, 2 Jan', hours: '0H/8H', progress: 0 },
    { name: 'Wed, 3 Jan', hours: '0H/8H', progress: 0 },
    { name: 'Thu, 4 Jan', hours: '0H/8H', progress: 0 },
    { name: 'Fri, 5 Jan', hours: '0H/8H', progress: 0 },
    { name: 'Sat, 6 Jan', hours: '0H/8H', progress: 0 },
    { name: 'Sun, 8 Jan', hours: '0H/8H', progress: 0 }
  ];

  const weekdays = showWeekend ? days : days.slice(0, 5);

  const handleAddEntry = (day) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate('');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaCalendarAlt size={24} />
              <h1 className="text-2xl font-bold">Manage Timesheet</h1>
            </div>
            <div className="flex items-center gap-3">
              <FaUser size={20} />
              <span className="text-xl font-semibold">Admin</span>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-blue-50 px-6 py-3 border-b">
          <span className="text-gray-600 text-sm">JIRA &gt; Manage Timesheet</span>
        </div>

        {/* Controls Section */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'Weekly' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setCurrentView('Weekly')}
                >
                  Weekly
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'Monthly' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setCurrentView('Monthly')}
                >
                  Monthly
                </button>
              </div>
              <span className="text-gray-600">Timesheet</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <FaChevronLeft />
                </button>
                <div className="text-lg font-semibold min-w-48 text-center">
                  {currentWeek}
                </div>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <FaChevronRight />
                </button>
                <FaCalendarAlt className="text-gray-500 ml-2" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">0 Hrs</span>
                <div className="w-16 h-2 bg-green-500 rounded-full relative">
                  <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{width: '100%'}}></div>
                </div>
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">100 Hrs</span>
                <span className="text-sm">184 Hrs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showWeekend}
                onChange={(e) => setShowWeekend(e.target.checked)}
                className="rounded"
              />
              <span>Show Weekend</span>
            </label>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FaCopy />
              Copy Last Week
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <FaDownload />
              Download Excel
            </button>
          </div>
        </div>

        {/* Timesheet Grid */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-4">
            {/* Days Column */}
            <div className="col-span-2">
              {weekdays.map((day, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-24">
                  <div className="font-semibold text-sm mb-2">{day.name}</div>
                  <div className="text-gray-600 text-xs mb-2">{day.hours}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${day.progress > 0 ? 'bg-green-500' : 'bg-gray-200'}`}
                      style={{width: `${day.progress}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Entries Grid */}
            <div className="col-span-10">
              <div className="grid grid-cols-7 gap-2">
                {weekdays.map((day, dayIndex) => (
                  <div key={dayIndex} className="min-h-24">
                    {timeEntries[day.name] ? (
                      timeEntries[day.name].map((entry, entryIndex) => (
                        <div key={entryIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                          <div className="font-semibold text-sm mb-2">{entry.project}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">Task:</span>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              {entry.task}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">Time:</span>
                            <span className="font-semibold text-xs">{entry.time}</span>
                            <span className="text-gray-500 text-xs">| {entry.percentage}%</span>
                            <FaEdit size={10} className="text-blue-600 cursor-pointer" />
                          </div>
                          <div className="text-xs text-gray-500">
                            Description: {entry.description}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div 
                        className="flex justify-center items-center min-h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
                        onClick={() => handleAddEntry(day.name)}
                      >
                        <FaPlus size={20} className="text-blue-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
            <FaClock />
            Submit Timesheet
          </button>
        </div>
      </div>

      {/* Log Time Modal */}
      <LogTimeModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
      />
    </div>
  );
}