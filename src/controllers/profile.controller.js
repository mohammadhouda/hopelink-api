import {getProfileService, updateProfileService} from "../services/profile.service.js";

export async function getProfileController(req, res) {
    try{
        const user_id = req.user.id;
        const profile = await getProfileService(user_id);
        res.status(200).json(profile);
    }
    catch(err){
        res.status(400).json({message: err.message});
    }
}

export async function updateProfileController(req, res) {
    try{
        const user_id = req.user.id;
        const updatedData = req.body;
        const updatedProfile = await updateProfileService(user_id, updatedData);
        res.status(200).json(updatedProfile);
    }
    catch(err){
        res.status(400).json({message: err.message});
    }
}