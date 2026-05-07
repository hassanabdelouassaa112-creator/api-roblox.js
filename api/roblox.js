export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { username } = req.query;

  if (!username) return res.status(400).json({ message: 'Username is required' });

  try {
    // البحث عن المستخدم مع إرجاع الأقرب
    const searchRes = await fetch(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`
    );
    const searchData = await searchRes.json();

    let user = null;

    if (searchData.data && searchData.data.length > 0) {
      // خذ أول نتيجة (الأقرب)
      user = searchData.data[0];
    } else {
      // إذا لم يوجد في البحث، جرب المطابقة التامة
      const exactRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      });
      const exactData = await exactRes.json();
      if (!exactData.data || exactData.data.length === 0)
        return res.status(404).json({ status: 404, message: 'Please enter a correct username' });
      user = exactData.data[0];
    }

    // جلب الصورة مع retry إذا كانت Pending
    let avatarUrl = '';
    for (let i = 0; i < 3; i++) {
      const avatarRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`
      );
      const avatarData = await avatarRes.json();
      const state = avatarData.data?.[0]?.state;
      avatarUrl = avatarData.data?.[0]?.imageUrl || '';
      if (state === 'Completed' && avatarUrl) break;
      await new Promise(r => setTimeout(r, 500));
    }

    return res.status(200).json({
      userId: user.id,
      userName: user.name,
      avatar: avatarUrl
    });

  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}
