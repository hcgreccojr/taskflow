import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { Avatar } from './Avatar';
import { Button } from './Button';
import styles from './Topbar.module.css';

interface TopbarProps {
  organizationId?: string;
}

export function Topbar({ organizationId }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <Link to="/orgs" className={styles.logo}>
          TaskFlow
        </Link>
        {organizationId && (
          <nav className={styles.nav}>
            <NavLink
              to={`/orgs/${organizationId}`}
              end
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              Quadros
            </NavLink>
            <NavLink
              to={`/orgs/${organizationId}/members`}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              Membros
            </NavLink>
          </nav>
        )}
      </div>
      <div className={styles.right}>
        {user && (
          <>
            <Avatar name={user.name} size={26} />
            <span className={styles.userName}>{user.name}</span>
          </>
        )}
        <Button variant="ghost" onClick={logout}>
          Sair
        </Button>
      </div>
    </div>
  );
}
