import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Trash2 } from 'lucide-react';

// --- Import Firebase services ---
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Settings({ currentUser }) {
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });

    // This useEffect fetches the user's settings from Firestore when the page loads
    useEffect(() => {
        if (!currentUser) return;

        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'profile');
        
        const fetchSettings = async () => {
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile({ name: data.name || currentUser.displayName, email: data.email || currentUser.email });
                setContacts(data.emergencyContacts || []);
            } else {
                setProfile({ name: currentUser.displayName, email: currentUser.email });
            }
        };

        fetchSettings();
    }, [currentUser]);

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handleNewContactChange = (e) => setNewContact({ ...newContact, [e.target.name]: e.target.value });

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'profile');
        try {
            await setDoc(settingsDocRef, { 
                name: profile.name, 
                email: profile.email 
            }, { merge: true });
            alert('Profile saved!');
        } catch (error) {
            console.error("Error saving profile: ", error);
            alert('Failed to save profile.');
        }
    };
  
    // --- FIX: This function now uses setDoc to prevent errors for new users ---
    const addContact = async (e) => {
        e.preventDefault();
        if (!currentUser || !newContact.name || !newContact.relationship || !newContact.phone) return;
        
        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'profile');
        const contactToAdd = { ...newContact, id: Date.now() };
        
        // Create the new, complete list of contacts in memory
        const updatedContacts = [...contacts, contactToAdd];

        try {
            // Use setDoc with { merge: true } to write the entire updated array.
            // This will create the document if it doesn't exist.
            await setDoc(settingsDocRef, {
                emergencyContacts: updatedContacts
            }, { merge: true });

            setContacts(updatedContacts); // Update local state
            setNewContact({ name: '', relationship: '', phone: '' }); // Clear form
        } catch (error) {
            console.error("Error adding contact: ", error);
            alert('Failed to add contact.');
        }
    }

    // --- FIX: This function is also updated for safety and consistency ---
    const removeContact = async (contactToRemove) => {
        if (!currentUser) return;
        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'profile');

        // Create the new list without the removed contact
        const updatedContacts = contacts.filter(contact => contact.id !== contactToRemove.id);

        try {
            await setDoc(settingsDocRef, {
                emergencyContacts: updatedContacts
            }, { merge: true });

            setContacts(updatedContacts); // Update local state
        } catch (error) {
            console.error("Error removing contact: ", error);
            alert('Failed to remove contact.');
        }
    }

    return (
        <div className="settings-container">
            {/* Profile Settings Card */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Profile Settings</h3>
                    <p className="card-description">Manage your personal information.</p>
                </div>
                <div className="card-content settings-form">
                    <div className="input-group">
                        <User className="input-icon" />
                        <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Your Name" />
                    </div>
                    <div className="input-group">
                        <Mail className="input-icon" />
                        <input name="email" type="email" value={profile.email} onChange={handleProfileChange} placeholder="Your Email" />
                    </div>
                </div>
                <div className="card-footer">
                    <button className="button primary" onClick={handleSaveProfile}>Save Profile</button>
                </div>
            </div>

            {/* Emergency Contacts Card */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Emergency Contacts</h3>
                    <p className="card-description">People to notify in a crisis. This is a critical safety feature.</p>
                </div>
                <div className="card-content">
                    <div className="contact-list">
                        {contacts.map(contact => (
                            <div key={contact.id} className="contact-item">
                                <div>
                                    <p className="contact-name">{contact.name} <span className="contact-relationship">({contact.relationship})</span></p>
                                    <p className="contact-phone"><Phone size={14} />{contact.phone}</p>
                                </div>
                                <button className="button danger small icon-button" onClick={() => removeContact(contact)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={addContact} className="add-contact-form">
                        <h4>Add a new contact</h4>
                        <div className="add-contact-inputs">
                            <input name="name" value={newContact.name} onChange={handleNewContactChange} placeholder="Full Name" required />
                            <input name="relationship" value={newContact.relationship} onChange={handleNewContactChange} placeholder="Relationship" required />
                            <input name="phone" type="tel" value={newContact.phone} onChange={handleNewContactChange} placeholder="Phone Number" required />
                        </div>
                        <button type="submit" className="button secondary">Add Contact</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
