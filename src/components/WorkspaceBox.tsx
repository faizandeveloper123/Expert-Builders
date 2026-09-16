import { useAuth } from '../auth';
import { useStaff } from '../StaffContext';

/**
 * The workspace box shown at the top of every sidebar. Instead of a static
 * business label it shows the signed-in user's picture, name and their
 * role context:
 *   Admin    -> "Admin"
 *   Dealer   -> "Dealer" + dealership code (when set)
 *   Follower -> "Follower of <dealer name>"
 */
function WorkspaceBox() {
  const { user } = useAuth();
  const { staff } = useStaff();
  if (!user) return null;

  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

  let sub = 'Follower';
  if (user.user_type === 'Admin') {
    sub = 'Admin';
  } else if (user.user_type === 'Dealer') {
    sub = user.system_id ? `Dealer · ${user.system_id}` : 'Dealer';
  } else {
    const manager = staff.find((s) => s.id === user.manager_id);
    sub = manager ? `Follower of ${manager.full_name}` : 'Follower';
  }

  return (
    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700/60 text-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold border border-slate-600/60">
        {user.avatar_data ? (
          <img src={user.avatar_data} alt={user.full_name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="truncate">
        <div className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</div>
        <div className="text-[10px] text-slate-400 truncate">{sub}</div>
      </div>
    </div>
  );
}

export default WorkspaceBox;
