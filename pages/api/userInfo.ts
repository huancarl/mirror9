import { withSession } from 'utils/session';

async function getSessionHandler(req, res) {
    const user = req.session.get('user');

    if (user && user.email) {
        res.status(200).json({ email: user.email });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

export default withSession(getSessionHandler);