import { NavLink } from 'react-router-dom'
import styles from './dashboardNav.module.css'

function getLinkClassName(isActive) {
   return isActive ? `${styles.link} ${styles.activeLink}` : styles.link
}

// Keeps reviewer navigation consistent across dashboard pages.
function DashboardNav() {
   return (
      <nav className={styles.navigation} aria-label="Reviewer dashboard navigation">
         <div className={styles.links}>
            <NavLink className={({ isActive }) => getLinkClassName(isActive)} to="/dashboard/products">Products</NavLink>
            <NavLink className={({ isActive }) => getLinkClassName(isActive)} to="/dashboard/conversations">Conversations</NavLink>
            <NavLink className={({ isActive }) => getLinkClassName(isActive)} to="/dashboard/settings">Settings</NavLink>
         </div>
         <NavLink className={styles.customerLink} to="/">Customer view</NavLink>
      </nav>
   )
}

export default DashboardNav
