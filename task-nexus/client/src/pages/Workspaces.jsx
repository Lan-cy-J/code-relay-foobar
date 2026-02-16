import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("nexus_token");

        axios.get("http://localhost:5000/api/workspaces", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setWorkspaces(res.data))
        .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>Workspaces</h2>

            {workspaces.length === 0 ? (
                <p>No workspaces yet</p>
            ) : (
                workspaces.map(ws => (
                    <div key={ws.id} style={{padding:"10px",border:"1px solid #ccc",margin:"10px"}}>
                        <h3>{ws.name}</h3>
                        <p>{ws.description}</p>
                    </div>
                ))
            )}
        </div>
    );
}
