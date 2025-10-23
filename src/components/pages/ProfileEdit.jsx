import React, { useState } from 'react';

export default function ProfileEdit() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');

  const handleSave = () => {
    // Save the updated data (for example, localStorage or API calls)
    console.log('Saved profile:', { nickname, bio, university });
  };

  return (
    <div className="profile-edit">
      <h2>Edit Profile</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div>
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label>University</label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>
        <button type="button" onClick={handleSave}>Save Changes</button>
      </form>
    </div>
  );
}
