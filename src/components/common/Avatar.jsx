export function Avatar({c,small=false}){return <div className={"avatar "+(small?"small ":"")+(c.online?"online":"")}>{c.initials}</div>}
