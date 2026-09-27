import { Icon } from "../Icon";
import { Link } from "../Link";

export function NotFound({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="center">
      <span className="mark">
        <Icon name="alert" size={20} />
      </span>
      <h1>Page not found</h1>
      <p>That address does not exist, or it moved. Nothing is wrong with your account.</p>
      <Link className="btn primary" to={signedIn ? "/app" : "/"}>
        {signedIn ? "Back to your dashboard" : "Back to the home page"}
      </Link>
    </div>
  );
}
