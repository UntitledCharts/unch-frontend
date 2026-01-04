import { Loader2 } from 'lucide-react';
import './Loading.css';

export default function Loading({ message }) {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <Loader2 className="loading-spinner-icon" size={48} />
                {message && <p className="loading-text">{message}</p>}
            </div>
        </div>
    );
}
