migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId('users');

  if (!usersCollection) {
    return null;
  }

  usersCollection.otp = usersCollection.otp || {};
  usersCollection.otp.enabled = true;
  usersCollection.otp.length = usersCollection.otp.length || 8;
  usersCollection.otp.duration = usersCollection.otp.duration || 180;

  return app.save(usersCollection);
}, (app) => {
  const usersCollection = app.findCollectionByNameOrId('users');

  if (!usersCollection) {
    return null;
  }

  usersCollection.otp = usersCollection.otp || {};
  usersCollection.otp.enabled = false;

  return app.save(usersCollection);
})
