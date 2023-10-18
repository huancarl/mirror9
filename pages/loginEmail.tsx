// loginWithEmail.tsx
import Link from 'next/link';

const LoginWithEmail: React.FC = () => {
    return (
        <div>
            <h1>Sign In with Email</h1>
            <form>
                <div>
                    <label>Email:</label>
                    <input type="email" required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" required />
                </div>
                <button type="submit">Sign In</button>
            </form>
            <Link href="/index">Go Back to Home</Link>
        </div>
    );
}

export default LoginWithEmail;

