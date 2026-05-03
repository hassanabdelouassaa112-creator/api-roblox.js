export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: 'Username is required' });
  try {
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });
    const userData = await userRes.json();
    if (!userData.data || userData.data.length === 0)
      return res.status(404).json({ status: 404, message: 'Please enter a correct username' });
    const user = userData.data[0];
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`
    );
    const avatarData = await avatarRes.json();
    return res.status(200).json({
      userId: user.id,
      userName: user.name,
      avatar: avatarData.data?.[0]?.imageUrl || ''
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}
