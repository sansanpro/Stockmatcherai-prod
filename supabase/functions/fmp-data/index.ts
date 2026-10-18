// Legacy name kept so already-installed app builds keep working; new code calls company-data.
import { handleCompanyDataRequest } from '../_shared/companyData.ts';

Deno.serve(handleCompanyDataRequest);
