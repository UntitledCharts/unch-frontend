export async function generateMetadata({ params }) {
    const { id } = await params;

    
    let account = null;
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        let data = null;

        
        try {
            const handleRes = await fetch(`${apiBase}/api/accounts/handle/${id}/`);
            if (handleRes.ok) {
                const handleData = await handleRes.json();
                if (handleData.sonolus_id) {
                    const profileRes = await fetch(`${apiBase}/api/accounts/${handleData.sonolus_id}`);
                    if (profileRes.ok) {
                        data = await profileRes.json();
                    }
                }
            }
        } catch (e) { }

        
        if (!data) {
            const res = await fetch(`${apiBase}/api/accounts/${id}`);
            if (res.ok) {
                data = await res.json();
            }
        }

        if (data && data.account) {
            account = data.account;
        }
    } catch (e) {
        console.error("Failed to fetch account for metadata", e);
    }

    if (!account) {
        return {
            title: "User Not Found | UntitledCharts",
            description: "This user profile could not be found."
        };
    }

    const title = `${account.sonolus_username || "User"} on UntitledCharts`;
    const description = `Check out ${account.sonolus_username || "User"}'s charts on UntitledCharts!`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
        }
    };
}

export default function UserLayout({ children }) {
    return <>{children}</>;
}
