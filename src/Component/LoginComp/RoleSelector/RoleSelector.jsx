import React from 'react';

const RoleSelector = ({ currentRole, onRoleChange }) => {
  return (
    <div className="role-selector">
      <div 
        className="role-glider" 
        style={{ transform: `translateX(${currentRole === 'admin' ? '100%' : '0'})` }}
      />
      <button
        type="button"
        className={`role-btn ${currentRole === 'user' ? 'active' : ''}`}
        onClick={() => onRoleChange('user')}
        aria-pressed={currentRole === 'user'}
      >
        Student
      </button>
      <button
        type="button"
        className={`role-btn ${currentRole === 'admin' ? 'active' : ''}`}
        onClick={() => onRoleChange('admin')}
        aria-pressed={currentRole === 'admin'}
      >
        Admin
      </button>
    </div>
  );
};

export default RoleSelector;